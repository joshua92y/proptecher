# backend/locations/tasks.py
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

try:
    from celery import shared_task
except ImportError:
    # Celery가 설치되지 않은 경우를 위한 대체
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
from django.conf import settings
from django.contrib.gis.db.models.functions import AsGeoJSON, Transform
from django.contrib.gis.geos import GEOSGeometry
from django.core.cache import cache
from django.db import transaction

from .models import Sido


@shared_task(bind=True, name='locations.generate_sido_topojson')
def generate_sido_topojson(self) -> Dict[str, Any]:
    """
    Sido 데이터를 기반으로 TopoJSON 파일을 생성하는 Celery Task
    
    Returns:
        Dict[str, Any]: 작업 결과 정보
    """
    try:
        # 1. DB에서 모든 Sido 데이터 조회
        self.update_state(state='PROGRESS', meta={'step': 'fetching_data'})
        
        # GeoJSON으로 변환하면서 조회 (SRID 4326으로 변환)
        queryset = Sido.objects.all().annotate(
            geom_geojson=AsGeoJSON(Transform('geom', 4326))
        )
        
        # FeatureCollection 생성
        features = []
        for sido in queryset:
            if not sido.geom_geojson:
                continue
                
            try:
                # GeoJSON 파싱
                geojson_geom = json.loads(sido.geom_geojson)
                
                # Feature 생성
                feature = {
                    "type": "Feature",
                    "id": str(sido.id),
                    "properties": {
                        "id": sido.id,
                        "name": sido.name,
                        "bjcd": sido.bjcd,
                        "ufid": sido.ufid,
                        "divi": sido.divi,
                        "scls": sido.scls,
                        "fmta": sido.fmta,
                        "created_at": sido.created_at.isoformat() if sido.created_at else None,
                        "updated_at": sido.updated_at.isoformat() if sido.updated_at else None,
                    },
                    "geometry": geojson_geom
                }
                features.append(feature)
                
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"Error processing Sido {sido.id}: {e}")
                continue
        
        # FeatureCollection 생성
        geojson_data = {
            "type": "FeatureCollection",
            "features": features
        }
        
        self.update_state(state='PROGRESS', meta={'step': 'converting_to_topojson'})
        
        # 2. GeoJSON을 TopoJSON으로 변환
        topojson_data = _geojson_to_topojson(geojson_data)
        
        self.update_state(state='PROGRESS', meta={'step': 'saving_file'})
        
        # 3. 파일 저장
        output_path = _save_topojson_file(topojson_data)
        
        self.update_state(state='PROGRESS', meta={'step': 'updating_cache'})
        
        # 4. 캐시 업데이트
        _update_topojson_cache(output_path, len(features))
        
        return {
            'status': 'success',
            'message': 'TopoJSON 파일이 성공적으로 생성되었습니다.',
            'file_path': str(output_path),
            'feature_count': len(features),
            'generated_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = f"TopoJSON 생성 중 오류 발생: {str(e)}"
        print(error_msg)
        
        # 캐시 상태를 실패로 업데이트
        cache.set('sido_topojson_ready', False, timeout=None)
        cache.set('sido_topojson_error', error_msg, timeout=3600)
        
        return {
            'status': 'error',
            'message': error_msg,
            'error': str(e)
        }


@shared_task(name='locations.clear_topojson_cache')
def clear_topojson_cache():
    """
    TopoJSON 관련 캐시를 모두 삭제하는 Task
    """
    try:
        # 관련 캐시 키들 삭제
        cache_keys = [
            'sido_topojson_ready',
            'sido_topojson_file',
            'sido_topojson_time',
            'sido_topojson_error',
            'sido_topojson_feature_count'
        ]
        
        for key in cache_keys:
            cache.delete(key)
        
        return {
            'status': 'success',
            'message': 'TopoJSON 캐시가 성공적으로 삭제되었습니다.'
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'캐시 삭제 중 오류 발생: {str(e)}'
        }


def _geojson_to_topojson(geojson_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    GeoJSON을 TopoJSON으로 변환 (Mapshaper 사용)
    
    Args:
        geojson_data: GeoJSON 데이터
        
    Returns:
        Dict[str, Any]: TopoJSON 데이터
    """
    try:
        import subprocess
        import tempfile
        import json
        
        # 임시 파일 생성
        with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as geojson_file:
            json.dump(geojson_data, geojson_file, ensure_ascii=False)
            geojson_path = geojson_file.name
        
        # TopoJSON 임시 파일 경로
        topojson_path = geojson_path.replace('.geojson', '.topojson')
        
        try:
            # Mapshaper를 사용하여 GeoJSON을 TopoJSON으로 변환
            cmd = [
                'mapshaper', 
                geojson_path,
                '-o', topojson_path,
                'format=topojson',
                'precision=0.000001'  # 소수점 6자리 정밀도
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=300  # 5분 타임아웃
            )
            
            if result.returncode != 0:
                raise Exception(f"Mapshaper 실행 오류: {result.stderr}")
            
            # 변환된 TopoJSON 파일 읽기
            with open(topojson_path, 'r', encoding='utf-8') as f:
                topojson_result = json.load(f)
            
            return topojson_result
            
        finally:
            # 임시 파일 정리
            import os
            try:
                os.unlink(geojson_path)
                if os.path.exists(topojson_path):
                    os.unlink(topojson_path)
            except OSError:
                pass
        
    except subprocess.TimeoutExpired:
        print("Mapshaper 변환 타임아웃")
        return _simple_geojson_to_topojson(geojson_data)
    except FileNotFoundError:
        print("Warning: mapshaper 명령어를 찾을 수 없습니다. Node.js와 mapshaper가 설치되어 있는지 확인하세요.")
        return _simple_geojson_to_topojson(geojson_data)
    except Exception as e:
        print(f"Mapshaper 변환 오류: {e}")
        return _simple_geojson_to_topojson(geojson_data)


def _simple_geojson_to_topojson(geojson_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    topojson 라이브러리 없이 간단한 TopoJSON 형태로 변환
    실제로는 GeoJSON과 동일하지만 TopoJSON 구조를 모방
    """
    return {
        "type": "Topology",
        "objects": {
            "sido": {
                "type": "GeometryCollection",
                "geometries": geojson_data["features"]
            }
        },
        "arcs": [],
        "bbox": _calculate_bbox(geojson_data["features"]),
        "transform": {
            "scale": [1, 1],
            "translate": [0, 0]
        }
    }


def _calculate_bbox(features: list) -> list:
    """
    Feature들의 경계 상자를 계산
    """
    if not features:
        return [0, 0, 0, 0]
    
    min_lon = min_lat = float('inf')
    max_lon = max_lat = float('-inf')
    
    for feature in features:
        geom = feature.get('geometry', {})
        if geom.get('type') == 'MultiPolygon':
            for polygon in geom.get('coordinates', []):
                for ring in polygon:
                    for coord in ring:
                        lon, lat = coord[0], coord[1]
                        min_lon = min(min_lon, lon)
                        max_lon = max(max_lon, lon)
                        min_lat = min(min_lat, lat)
                        max_lat = max(max_lat, lat)
    
    return [min_lon, min_lat, max_lon, max_lat]


def _save_topojson_file(topojson_data: Dict[str, Any]) -> Path:
    """
    TopoJSON 데이터를 파일로 저장
    
    Args:
        topojson_data: TopoJSON 데이터
        
    Returns:
        Path: 저장된 파일 경로
    """
    # 디렉토리 생성
    output_dir = Path(settings.STATIC_ROOT) / "data" / "locations"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 파일 경로
    output_path = output_dir / "sido_topo.json"
    
    # JSON 파일로 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(topojson_data, f, ensure_ascii=False, indent=2)
    
    return output_path


def _update_topojson_cache(file_path: Path, feature_count: int):
    """
    TopoJSON 관련 캐시 상태 업데이트
    
    Args:
        file_path: 생성된 파일 경로
        feature_count: Feature 개수
    """
    now = datetime.now()
    
    # 캐시 업데이트
    cache.set('sido_topojson_ready', True, timeout=None)
    cache.set('sido_topojson_file', str(file_path), timeout=None)
    cache.set('sido_topojson_time', now.isoformat(), timeout=None)
    cache.set('sido_topojson_feature_count', feature_count, timeout=None)
    
    # 에러 캐시 삭제
    cache.delete('sido_topojson_error')
