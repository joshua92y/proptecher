# backend/locations/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
try:
    from celery import current_app
except ImportError:
    # Celery가 설치되지 않은 경우를 위한 대체
    class MockCelery:
        def delay(self, *args, **kwargs):
            return None
    current_app = MockCelery()

from .models import Sido
from .tasks import generate_sido_topojson, clear_topojson_cache


@receiver(post_save, sender=Sido)
def sido_post_save(sender, instance, created, **kwargs):
    """
    Sido 모델 저장 후 신호 처리
    - 캐시 무효화
    - TopoJSON 재생성 Task 실행
    """
    try:
        print(f"Sido post_save signal triggered - ID: {instance.id}, Created: {created}")
        
        # 1. TopoJSON 관련 캐시 무효화
        _invalidate_topojson_cache()
        
        # 2. TopoJSON 재생성 Task 실행 (비동기)
        task = generate_sido_topojson.delay()
        print(f"TopoJSON regeneration task queued: {task.id}")
        
    except Exception as e:
        print(f"Error in sido_post_save signal: {e}")


@receiver(post_delete, sender=Sido)
def sido_post_delete(sender, instance, **kwargs):
    """
    Sido 모델 삭제 후 신호 처리
    - 캐시 무효화
    - TopoJSON 재생성 Task 실행
    """
    try:
        print(f"Sido post_delete signal triggered - ID: {instance.id}")
        
        # 1. TopoJSON 관련 캐시 무효화
        _invalidate_topojson_cache()
        
        # 2. TopoJSON 재생성 Task 실행 (비동기)
        task = generate_sido_topojson.delay()
        print(f"TopoJSON regeneration task queued after delete: {task.id}")
        
    except Exception as e:
        print(f"Error in sido_post_delete signal: {e}")


def _invalidate_topojson_cache():
    """
    TopoJSON 관련 캐시를 무효화
    """
    try:
        # 캐시 무효화
        cache_keys = [
            'sido_topojson_ready',
            'sido_topojson_file',
            'sido_topojson_time',
            'sido_topojson_feature_count'
        ]
        
        for key in cache_keys:
            cache.delete(key)
        
        print("TopoJSON cache invalidated successfully")
        
    except Exception as e:
        print(f"Error invalidating TopoJSON cache: {e}")


def invalidate_topojson_cache_manually():
    """
    수동으로 TopoJSON 캐시를 무효화하고 재생성하는 함수
    API나 관리자에서 호출 가능
    """
    try:
        # 1. 캐시 무효화
        _invalidate_topojson_cache()
        
        # 2. 재생성 Task 실행
        task = generate_sido_topojson.delay()
        
        return {
            'status': 'success',
            'message': 'TopoJSON 캐시가 무효화되고 재생성 작업이 시작되었습니다.',
            'task_id': task.id
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': f'캐시 무효화 중 오류 발생: {str(e)}'
        }
