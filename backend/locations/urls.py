# backend/locations/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SidoViewSet, topojson_sido_api, topojson_sido_status_api, bus_list_api

router = DefaultRouter()
router.register(r'sido', SidoViewSet, basename='sido')

urlpatterns = [
    # TopoJSON API 엔드포인트
    path('topojson/sido/', topojson_sido_api, name='topojson_sido'),
    path('topojson/sido/status/', topojson_sido_status_api, name='topojson_sido_status'),
    # 근접 버스정류장 조회 (목업/박스 필터)
    path('bus/list', bus_list_api, name='bus_list'),
] + router.urls
