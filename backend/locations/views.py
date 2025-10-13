# backend/locations/views.py
import hashlib
import json
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.contrib.gis.db.models.functions import AsGeoJSON, Transform
from django.db.models import Value
from django.contrib.gis.db.models import GeometryField
from django.db.models import Func
from django.core.cache import cache
from django.http import JsonResponse, HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Sido
from .serializers import SidoSerializer, DEFAULT_SIMPLIFY_TOLERANCE
from .tasks import generate_sido_topojson, clear_topojson_cache
from .signals import invalidate_topojson_cache_manually

CACHE_DETAIL_PREFIX = "sido_detail_cache"
CACHE_LIST_PREFIX = "sido_list_cache"
CACHE_TIMEOUT_SECONDS = 60 * 60


# ✅ PostGIS ST_SimplifyPreserveTopology 직접 래퍼
class SimplifyPreserveTopology(Func):
    function = "ST_SimplifyPreserveTopology"
    output_field = GeometryField()


class SidoViewSet(viewsets.ModelViewSet):
    """
    시/도 단일 Feature 조회 + 전체 조회 + CRUD
    """
    queryset = Sido.objects.all()
    serializer_class = SidoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        if getattr(self, "request", None) is None:
            return queryset
        if self.action in {"list", "retrieve"}:
            tolerance = self._get_simplify_tolerance()
            transformed = Transform("geom", 4326)
            if tolerance > 0:
                transformed = SimplifyPreserveTopology(transformed, Value(tolerance))
            queryset = queryset.annotate(geom_geojson=AsGeoJSON(transformed))
        return queryset

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        cache_key = self._build_cache_key(CACHE_DETAIL_PREFIX, request, identifier=pk)

        data = self._get_from_cache(cache_key)
        if data:
            return Response(data)

        instance = self.get_object()
        serializer = self.get_serializer(instance, context={"request": request})
        data = serializer.data

        self._set_cache(cache_key, data)
        return Response(data)

    def list(self, request, *args, **kwargs):
        cache_key = self._build_cache_key(CACHE_LIST_PREFIX, request)

        data = self._get_from_cache(cache_key)
        if data:
            return Response(data)

        queryset = self.filter_queryset(self.get_queryset())
        items = list(queryset)
        serializer = self.get_serializer(items, many=True, context={"request": request})
        payload = {
            "type": "FeatureCollection",
            "features": serializer.data,
            "total_count": len(items),
        }

        self._set_cache(cache_key, payload)
        return Response(payload)

    # ✅ 캐시 관련
    def _get_from_cache(self, key):
        from django.core.cache import cache
        return cache.get(key)

    def _set_cache(self, key, value):
        from django.core.cache import cache
        cache.set(key, value, CACHE_TIMEOUT_SECONDS)

    def clear_cache(self):
        from django.core.cache import cache
        cache.clear()

    # ✅ simplify tolerance 파라미터 파싱
    def _get_simplify_tolerance(self, request=None):
        if hasattr(self, "_simplify_tolerance"):
            return self._simplify_tolerance
        tolerance = DEFAULT_SIMPLIFY_TOLERANCE
        current_request = request or getattr(self, "request", None)
        raw_value = None
        if current_request is not None:
            raw_value = current_request.query_params.get("simplify")
            if raw_value is None and hasattr(current_request, "GET"):
                raw_value = current_request.GET.get("simplify")
        if raw_value is not None:
            try:
                tolerance = max(float(raw_value), 0.0)
            except (TypeError, ValueError):
                tolerance = DEFAULT_SIMPLIFY_TOLERANCE
        self._simplify_tolerance = tolerance
        return tolerance

    def _query_params_signature(self, request):
        if request is None:
            return "no_params"
        items = []
        for key, values in request.query_params.lists():
            items.append(f"{key}={'|'.join(sorted(values))}")
        serialized = "&".join(sorted(items))
        return hashlib.md5(serialized.encode("utf-8")).hexdigest()

    def _build_cache_key(self, prefix, request, identifier=None):
        parts = [prefix]
        if identifier is not None:
            parts.append(f"id_{identifier}")
        parts.append(f"params_{self._query_params_signature(request)}")
        return "_".join(parts)

    # ✅ CRUD 후 캐시 무효화
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        self.clear_cache()
        # TopoJSON 재생성은 signal에서 처리됨
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        self.clear_cache()
        # TopoJSON 재생성은 signal에서 처리됨
        return response

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        self.clear_cache()
        # TopoJSON 재생성은 signal에서 처리됨
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        self.clear_cache()
        # TopoJSON 재생성은 signal에서 처리됨
        return response

    @action(detail=False, methods=['post'], url_path='regenerate-topojson')
    def regenerate_topojson(self, request):
        """
        수동으로 TopoJSON 재생성
        """
        try:
            result = invalidate_topojson_cache_manually()
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'TopoJSON 재생성 중 오류 발생: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def topojson_sido_api(request):
    """
    TopoJSON API 엔드포인트
    GET /api/topojson/sido
    """
    try:
        # 1. 캐시에서 상태 확인
        is_ready = cache.get('sido_topojson_ready', False)
        file_path = cache.get('sido_topojson_file')
        
        if not is_ready or not file_path:
            # TopoJSON이 준비되지 않음
            error_msg = cache.get('sido_topojson_error', 'TopoJSON 파일이 준비되지 않았습니다.')
            return JsonResponse({
                'status': 'error',
                'message': error_msg,
                'ready': False
            }, status=503)
        
        # 2. 파일 존재 확인
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            # 파일이 존재하지 않음
            cache.set('sido_topojson_ready', False, timeout=None)
            return JsonResponse({
                'status': 'error',
                'message': 'TopoJSON 파일을 찾을 수 없습니다.',
                'ready': False
            }, status=503)
        
        # 3. 파일 읽기 및 반환
        try:
            with open(file_path_obj, 'r', encoding='utf-8') as f:
                topojson_data = json.load(f)
            
            # 메타데이터 추가
            response_data = {
                'status': 'success',
                'ready': True,
                'generated_at': cache.get('sido_topojson_time'),
                'feature_count': cache.get('sido_topojson_feature_count', 0),
                'file_path': str(file_path),
                'data': topojson_data
            }
            
            return JsonResponse(response_data, status=200)
            
        except (json.JSONDecodeError, IOError) as e:
            return JsonResponse({
                'status': 'error',
                'message': f'TopoJSON 파일 읽기 오류: {str(e)}',
                'ready': False
            }, status=500)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'API 오류: {str(e)}',
            'ready': False
        }, status=500)


def topojson_sido_status_api(request):
    """
    TopoJSON 상태 확인 API
    GET /api/topojson/sido/status
    """
    try:
        is_ready = cache.get('sido_topojson_ready', False)
        file_path = cache.get('sido_topojson_file')
        generated_at = cache.get('sido_topojson_time')
        feature_count = cache.get('sido_topojson_feature_count', 0)
        error_msg = cache.get('sido_topojson_error')
        
        status_data = {
            'ready': is_ready,
            'file_path': file_path,
            'generated_at': generated_at,
            'feature_count': feature_count,
            'error': error_msg
        }
        
        if is_ready and file_path:
            file_path_obj = Path(file_path)
            status_data['file_exists'] = file_path_obj.exists()
            if file_path_obj.exists():
                status_data['file_size'] = file_path_obj.stat().st_size
                status_data['file_modified'] = datetime.fromtimestamp(
                    file_path_obj.stat().st_mtime
                ).isoformat()
        
        return JsonResponse(status_data, status=200)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'상태 확인 오류: {str(e)}'
        }, status=500)
