# backend/config/celery.py
import os
from celery import Celery

# Django 설정 모듈 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Celery 앱 생성
app = Celery('config')

# Django 설정에서 Celery 설정 로드
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django 앱에서 tasks 자동 발견
app.autodiscover_tasks()

# Celery 앱 정보
app.conf.update(
    # Task 라우팅
    task_routes={
        'locations.tasks.generate_sido_topojson': {'queue': 'topojson'},
        'locations.tasks.clear_topojson_cache': {'queue': 'cache'},
    },
    
    # 큐 설정
    task_default_queue='default',
    task_queues={
        'default': {
            'exchange': 'default',
            'routing_key': 'default',
        },
        'topojson': {
            'exchange': 'topojson',
            'routing_key': 'topojson',
        },
        'cache': {
            'exchange': 'cache',
            'routing_key': 'cache',
        },
    },
    
    # Task 결과 설정
    result_expires=3600,  # 1시간
    result_persistent=True,
    
    # Worker 설정
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Beat 스케줄러 설정 (필요시)
    beat_schedule={
        # 주기적 캐시 정리 (선택사항)
        # 'cleanup-topojson-cache': {
        #     'task': 'locations.tasks.cleanup_old_topojson',
        #     'schedule': crontab(hour=2, minute=0),  # 매일 새벽 2시
        # },
    },
)

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
