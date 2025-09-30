# backend/locations/views.py
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from django.core.cache import cache
from rest_framework_gis.filters import InBBoxFilter   # 🔹 추가
from .models import Sido
from .serializers import SidoSerializer

CACHE_KEY = "sido_list_cache"

class SidoViewSet(viewsets.ModelViewSet):
    queryset = Sido.objects.all()
    serializer_class = SidoSerializer
    permission_classes = [AllowAny]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, InBBoxFilter]
    bbox_filter_field = "geom"   # 🔹 필수 (bbox filtering 할 필드)
    filterset_fields = ["bjcd"]
    search_fields = ["name"]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        cache.delete(CACHE_KEY)
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        cache.delete(CACHE_KEY)
        return response

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        cache.delete(CACHE_KEY)
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        cache.delete(CACHE_KEY)
        return response
