# backend/locations/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Sido
from .serializers import (
    SidoSerializer,
    SidoCreateSerializer,
    SidoUpdateSerializer,
)
from .cache_utils import get_sido_data, refresh_sido_cache


@receiver([post_save, post_delete], sender=Sido)
def clear_sido_cache(sender, **kwargs):
    refresh_sido_cache()


class SidoPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SidoViewSet(viewsets.ModelViewSet):
    queryset = Sido.objects.all()
    serializer_class = SidoSerializer
    pagination_class = SidoPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["divi", "scls", "fmta"]
    search_fields = ["name", "bjcd", "ufid"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]
    lookup_field = "ufid"

    def get_permissions(self):
        if self.action in ["list", "retrieve", "search", "stats"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return SidoCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return SidoUpdateSerializer
        return SidoSerializer

    @action(detail=False, methods=["get"])
    def search(self, request):
        query = request.query_params.get("q", "")
        if not query:
            return Response({"error": "검색어를 입력해주세요."}, status=400)

        queryset = self.get_queryset().filter(
            Q(name__icontains=query) | Q(bjcd__icontains=query) | Q(ufid__icontains=query)
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        total_count = self.get_queryset().count()
        divi_stats = self.get_queryset().values("divi").distinct().count()

        return Response(
            {
                "total_count": total_count,
                "division_count": divi_stats,
                "message": "시도 통계 정보",
            }
        )