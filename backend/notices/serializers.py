from rest_framework import serializers
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    """
    공지사항 Serializer
    """
    id = serializers.CharField()
    title = serializers.CharField(source='제목')
    content = serializers.CharField(source='내용')
    target = serializers.CharField(source='대상')
    is_new = serializers.BooleanField(source='신규여부')
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = ['id', 'title', 'content', 'target', 'is_new', 'created_at']

    def get_created_at(self, obj):
        return int(obj.작성일시.timestamp() * 1000)  # JavaScript timestamp

