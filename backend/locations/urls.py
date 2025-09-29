# backend/locations/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SidoViewSet

router = DefaultRouter()
router.register(r'sido', SidoViewSet, basename='sido')

urlpatterns = [
    path('', include(router.urls)),
]