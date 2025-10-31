from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(required=False, allow_blank=True)
    user_type = serializers.ChoiceField(choices=["seeker", "appraiser", "agent"], default="seeker")
    preferred_regions = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    purpose = serializers.ChoiceField(choices=["귀어","귀농","취업","기타"], required=False, allow_null=True)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return value

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")
        name = validated_data.get("name", "")
        user_type = validated_data.get("user_type", "seeker")

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name[:30] if name else "",
        )

        # 사용자 유형 매핑: seeker -> user, appraiser/agent -> agent
        profile_type = "user" if user_type == "seeker" else "agent"
        profile = UserProfile.objects.create(user=user, 사용자유형=profile_type)

        # 추가 정보 저장
        pref = validated_data.get("preferred_regions")
        purpose = validated_data.get("purpose")
        if isinstance(pref, list):
            profile.선호지역목록 = pref
        if purpose:
            profile.귀촌목적 = purpose
        profile.save()

        return user




