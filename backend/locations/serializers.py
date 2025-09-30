# backend/locations/serializers.py
from rest_framework import serializers
from .models import Sido


class SidoSerializer(serializers.ModelSerializer):
    """기본 Sido Serializer (geometry 포함)"""
    class Meta:
        model = Sido
        fields = [
            "ufid",
            "bjcd",
            "name",
            "divi",
            "scls",
            "fmta",
            "created_at",
            "updated_at",
            "geom",
        ]
        read_only_fields = ["ufid", "created_at", "updated_at"]


class SidoCreateSerializer(serializers.ModelSerializer):
    """Sido 생성 Serializer"""
    ufid = serializers.CharField(required=True)

    class Meta:
        model = Sido
        fields = ["ufid", "bjcd", "name", "divi", "scls", "fmta", "geom"]


class SidoUpdateSerializer(serializers.ModelSerializer):
    """Sido 수정 Serializer"""
    class Meta:
        model = Sido
        fields = ["bjcd", "name", "divi", "scls", "fmta", "geom"]
