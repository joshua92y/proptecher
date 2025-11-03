from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property
from .serializers import PropertyListSerializer, PropertyDetailSerializer
from rest_framework.decorators import action
from locations.models import BusStop, SubwayStation
from inspections.models import InspectionProgress, Floorplan
import math
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance


class PropertyViewSet(viewsets.ModelViewSet):
    """
    매물 ViewSet
    
    - list: 지도 범위 내 매물 목록 조회 (공개)
    - retrieve: 매물 상세 정보 조회 (공개)
    - create/update/delete: 관리자용 (추후 권한 추가)
    """
    queryset = Property.objects.filter(활성화여부=True, 매물상태='available')
    serializer_class = PropertyDetailSerializer
    permission_classes = [AllowAny]  # 공개 API
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['매물타입', '주택종류', '지역ID']
    search_fields = ['주소', '도로명주소', '지번주소']
    ordering_fields = ['생성일시', '조회수', '찜수']
    
    def get_serializer_class(self):
        """액션에 따라 다른 Serializer 사용"""
        if self.action == 'list':
            return PropertyListSerializer
        return PropertyDetailSerializer

    @action(detail=True, methods=['get'], url_path='bus-score')
    def bus_score(self, request, pk=None):
        """
        GET /api/properties/{id}/bus-score?buffer=500
        근처 버스정류장 기반 점수 산출(간단한 규칙)
        """
        try:
            prop = self.get_queryset().get(pk=pk)
        except Property.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        buf = float(request.query_params.get('buffer', '500'))
        if prop.위도 is None or prop.경도 is None:
            return Response({'score': 0, 'stops': []})
        lat = float(prop.위도)
        lng = float(prop.경도)
        ddeg = buf / 111000.0
        qs = BusStop.objects.filter(
            위치__y__gte=lat - ddeg,
            위치__y__lte=lat + ddeg,
            위치__x__gte=lng - ddeg,
            위치__x__lte=lng + ddeg,
        )[:200]

        count = qs.count()
        # 단순 점수: 개수 기반 0~100 스케일링
        score = max(0, min(100, int((count / 20) * 100)))
        stops = [
            {'id': s.정류장번호, 'name': s.정류장명, 'lat': s.위도, 'lng': s.경도}
            for s in qs
        ]
        return Response({'score': score, 'count': count, 'stops': stops})

    @action(detail=True, methods=['get'], url_path='nearby')
    def nearby(self, request, pk=None):
        """
        GET /api/properties/{id}/nearby?radius_m=1000

        매물 위치 기준 반경 내 지하철역과 버스정류장을 조회합니다.
        - 반경 기본값: 1000m
        - 결과는 거리 오름차순으로 정렬
        """
        try:
            prop = self.get_queryset().get(pk=pk)
        except Property.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if prop.위도 is None or prop.경도 is None:
            return Response({'bus_stops': [], 'stations': []})

        try:
            radius_m = float(request.query_params.get('radius_m', '1000'))
        except ValueError:
            radius_m = 1000.0

        lat = float(prop.위도)
        lng = float(prop.경도)

        center = Point(lng, lat, srid=4326)

        # PostGIS distance 쿼리 사용
        bus_qs = (
            BusStop.objects
            .filter(위치__distance_lte=(center, D(m=radius_m)))
            .annotate(_dist=Distance('위치', center))
            .order_by('_dist')
        )
        sub_qs = (
            SubwayStation.objects
            .filter(위치__distance_lte=(center, D(m=radius_m)))
            .annotate(_dist=Distance('위치', center))
            .order_by('_dist')
        )

        def haversine_m(lat1, lon1, lat2, lon2):
            R = 6371000.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dl = math.radians(lon2 - lon1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
            c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
            return R * c

        bus_list = []
        for s in bus_qs[:500]:
            if s.위치 is None:
                continue
            dist = getattr(s, '_dist', None)
            dist_m = int(round(float(dist.m))) if dist is not None else int(round(haversine_m(lat, lng, float(s.위치.y), float(s.위치.x))))
            bus_list.append({
                'stop_name': s.정류장명,
                'distance_m': dist_m,
                'lat': float(s.위도) if s.위도 is not None else None,
                'lng': float(s.경도) if s.경도 is not None else None,
                'bus_numbers': [],
            })

        sub_list = []
        for st in sub_qs[:500]:
            if st.위치 is None:
                continue
            dist = getattr(st, '_dist', None)
            dist_m = int(round(float(dist.m))) if dist is not None else int(round(haversine_m(lat, lng, float(st.위치.y), float(st.위치.x))))
            # 노선명 분리
            lines_raw = (st.노선명 or '')
            for sep in ['/', '·', '∙', '|']:
                lines_raw = lines_raw.replace(sep, ',')
            line_names = [x.strip() for x in lines_raw.split(',') if x.strip()]
            sub_list.append({
                'station_name': st.역명,
                'line_names': line_names,
                'distance_m': dist_m,
                'lat': float(st.위치.y),
                'lng': float(st.위치.x),
                'address': st.주소,
            })

        # 거리 기준 정렬 및 상한(각 100개) 적용
        # 이미 거리순 정렬되어 있으므로 상한만 적용 (버스 3개, 지하철 2개)
        bus_list = bus_list[:3]
        sub_list = sub_list[:2]

        return Response({'bus_stops': bus_list, 'stations': sub_list})

    @action(detail=True, methods=['get'], url_path='floorplan')
    def floorplan(self, request, pk=None):
        """
        GET /api/properties/{id}/floorplan
        - 평가사가 그린 평면도(최신 임장) 이미지를 우선 반환
        - 없으면 임장 진행의 평면도URL(업로드 이미지) 반환
        - 둘 다 없으면 image_url = null
        """
        try:
            # 최신 임장 진행 찾기 (요청ID.매물ID=pk)
            active = (
                InspectionProgress.objects
                .filter(요청ID__매물ID__id=pk)
                .order_by('-수정일시', '-시작일시')
                .first()
            )
        except Exception:
            active = None

        image_url = None
        source = None
        if active:
            try:
                fp = active.floorplan
                if fp and fp.이미지URL:
                    image_url = fp.이미지URL
                    source = 'drawn'
            except Floorplan.DoesNotExist:
                pass

            if image_url is None and active.평면도URL:
                image_url = active.평면도URL
                source = 'uploaded'

        return Response({'image_url': image_url, 'source': source})
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/properties?bounds=sw_lat,sw_lng,ne_lat,ne_lng
        
        지도 범위 내 매물 목록 조회
        
        Query Parameters:
            - bounds: 지도 남서-북동 좌표 (예: 34.999,126.999,35.002,127.001)
        
        Response:
            {
                "properties": [
                    {
                        "id": "1",
                        "title": "전세 2억 5500",
                        "price": "2.55억",
                        "addr": "무주읍 적천로 343",
                        "lat": 35.0,
                        "lng": 127.0,
                        "img": "/images/house1.jpg"
                    }
                ]
            }
        """
        bounds = request.query_params.get('bounds')
        
        queryset = self.filter_queryset(self.get_queryset())
        
        # 지도 범위 필터링
        if bounds:
            try:
                sw_lat, sw_lng, ne_lat, ne_lng = map(float, bounds.split(','))
                queryset = queryset.filter(
                    위도__gte=sw_lat,
                    위도__lte=ne_lat,
                    경도__gte=sw_lng,
                    경도__lte=ne_lng
                )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid bounds format. Expected: sw_lat,sw_lng,ne_lat,ne_lng'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # 페이지네이션
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'properties': serializer.data})
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/properties/{id}
        
        매물 상세 정보 조회
        
        Response:
            {
                "listing_type": "전세",
                "jeonse_price": 320000000,
                "address": "서울특별시 강남구 테헤란로 123",
                "maintenance_fee_monthly": 120000,
                "parking_info": "주차 1대",
                "exclusive_area_sqm": 84.97,
                "exclusive_area_pyeong": 25.72,
                "rooms": 3,
                "bathrooms": 2,
                "floor": "12/25",
                "built_year": 2008,
                ...
            }
        """
        instance = self.get_object()
        
        # 조회수 증가
        instance.조회수 += 1
        instance.save(update_fields=['조회수'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
