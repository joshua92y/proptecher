from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Notice
from .serializers import NoticeSerializer


class NoticeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    공지사항 ViewSet (읽기 전용)
    """
    queryset = Notice.objects.filter(활성화여부=True)
    serializer_class = NoticeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        target = self.request.query_params.get('target')

        if target:
            queryset = queryset.filter(대상__in=['all', target])

        return queryset.order_by('-작성일시')[:10]  # 최근 10개만
