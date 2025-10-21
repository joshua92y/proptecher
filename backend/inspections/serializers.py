from rest_framework import serializers
from .models import InspectionRequest, ActiveInspection, InspectionCancellation


class InspectionRequestCreateSerializer(serializers.ModelSerializer):
    """
    임장 요청 생성용 Serializer (소비자)
    """
    listing_id = serializers.CharField(write_only=True)
    title = serializers.CharField(source='매물제목')
    address = serializers.CharField(source='매물주소')
    priceText = serializers.CharField(source='가격정보')
    img = serializers.CharField(source='매물이미지URL', allow_null=True)
    preferred_date = serializers.DateField(source='희망날짜')
    contact_phone = serializers.CharField(source='연락처')
    request_note = serializers.CharField(source='요청사항', allow_null=True, required=False)

    class Meta:
        model = InspectionRequest
        fields = [
            'listing_id', 'title', 'address', 'priceText', 'img',
            'preferred_date', 'contact_phone', 'request_note'
        ]

    def create(self, validated_data):
        listing_id = validated_data.pop('listing_id', None)
        user = self.context['request'].user

        # Listing 객체 조회
        from listings.models import Listing
        try:
            listing = Listing.objects.get(id=listing_id)
            validated_data['매물ID'] = listing
        except Listing.DoesNotExist:
            raise serializers.ValidationError("매물을 찾을 수 없습니다.")

        # 요청자 설정
        from users.models import UserProfile
        try:
            user_profile = UserProfile.objects.get(user=user)
            validated_data['요청자ID'] = user_profile
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("사용자 프로필을 찾을 수 없습니다.")

        return super().create(validated_data)


class RequestCardSerializer(serializers.ModelSerializer):
    """
    임장 요청 카드용 Serializer (평가사 대시보드)
    """
    id = serializers.CharField()
    title = serializers.CharField(source='매물제목')
    address = serializers.CharField(source='매물주소')
    priceText = serializers.CharField(source='가격정보')
    img = serializers.CharField(source='매물이미지URL', allow_null=True)

    class Meta:
        model = InspectionRequest
        fields = ['id', 'title', 'address', 'priceText', 'img']


class RequestDetailSerializer(serializers.ModelSerializer):
    """
    임장 요청 상세용 Serializer (평가사)
    """
    id = serializers.CharField()
    listing_id = serializers.CharField(source='매물ID.id')
    title = serializers.CharField(source='매물제목')
    address = serializers.CharField(source='매물주소')
    priceText = serializers.CharField(source='가격정보')
    fee_won = serializers.IntegerField(source='임장비')
    preferred_date = serializers.DateField(source='희망날짜')
    contact_phone = serializers.CharField(source='연락처')
    request_note = serializers.CharField(source='요청사항', allow_null=True)
    description = serializers.CharField(source='매물설명', allow_null=True)
    highlights = serializers.JSONField(source='특이사항', allow_null=True)
    photos = serializers.JSONField(source='현재사진URLs', allow_null=True)
    requested_at = serializers.SerializerMethodField()
    img = serializers.CharField(source='매물이미지URL', allow_null=True)

    class Meta:
        model = InspectionRequest
        fields = [
            'id', 'listing_id', 'title', 'address', 'priceText', 'fee_won',
            'preferred_date', 'contact_phone', 'request_note', 'description',
            'highlights', 'photos', 'requested_at', 'img'
        ]

    def get_requested_at(self, obj):
        return int(obj.요청일시.timestamp() * 1000)  # JavaScript timestamp


class ActiveInspectionSerializer(serializers.ModelSerializer):
    """
    진행중인 임장용 Serializer
    """
    id = serializers.CharField()
    requestId = serializers.CharField(source='요청ID.id')
    title = serializers.CharField(source='요청ID.매물제목')
    address = serializers.CharField(source='요청ID.매물주소')
    priceText = serializers.CharField(source='요청ID.가격정보')
    progress = serializers.IntegerField(source='진행률')
    img = serializers.CharField(source='요청ID.매물이미지URL', allow_null=True)

    class Meta:
        model = ActiveInspection
        fields = ['id', 'requestId', 'title', 'address', 'priceText', 'progress', 'img']


class InspectionStatusSerializer(serializers.Serializer):
    """
    임장 상태 조회용 Serializer
    """
    status = serializers.ChoiceField(
        choices=['requested', 'active'],
        allow_null=True
    )

