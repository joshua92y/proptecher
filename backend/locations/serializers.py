# backend/locations/serializers.py
from rest_framework import serializers
from .models import Sido


class SidoSerializer(serializers.ModelSerializer):
    """
    시도 조회용 시리얼라이저
    """
    class Meta:
        model = Sido
        fields = [
            'ufid',
            'bjcd',
            'name',
            'divi',
            'scls',
            'fmta',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['ufid', 'created_at', 'updated_at']


class SidoCreateSerializer(serializers.ModelSerializer):
    """
    시도 생성용 시리얼라이저
    """
    class Meta:
        model = Sido
        fields = ['ufid', 'bjcd', 'name', 'divi', 'scls', 'fmta']

    def validate_ufid(self, value):
        if Sido.objects.filter(ufid=value).exists():
            raise serializers.ValidationError("UFID already exists")
        return value

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Name is required")
        return value


class SidoUpdateSerializer(serializers.ModelSerializer):
    """
    시도 수정용 시리얼라이저
    """
    class Meta:
        model = Sido
        fields = ['bjcd', 'name', 'divi', 'scls', 'fmta']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Name is required")
        return value
