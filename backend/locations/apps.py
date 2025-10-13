# backend/locations/apps.py
from django.apps import AppConfig


class LocationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'locations'
    verbose_name = '지역 정보 관리'

    def ready(self):
        """
        앱이 준비되면 signals를 import하여 등록
        """
        import locations.signals