# backend/locations/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SidoViewSet, topojson_sido_api, topojson_sido_status_api

router = DefaultRouter()
router.register(r'sido', SidoViewSet, basename='sido')

urlpatterns = [
    # TopoJSON API 엔드포인트
    path('topojson/sido/', topojson_sido_api, name='topojson_sido'),
    path('topojson/sido/status/', topojson_sido_status_api, name='topojson_sido_status'),
] + router.urls
