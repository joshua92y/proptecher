from rest_framework import serializers
from .models import Listing


class ListingListSerializer(serializers.ModelSerializer):
    """
    매물 목록용 Serializer (지도에 표시할 간단한 정보)
    """
    id = serializers.CharField(read_only=True)
    title = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    addr = serializers.CharField(source='주소')
    lat = serializers.DecimalField(source='위도', max_digits=10, decimal_places=8)
    lng = serializers.DecimalField(source='경도', max_digits=11, decimal_places=8)
    img = serializers.SerializerMethodField()
    type = serializers.CharField(source='주택종류')
    
    class Meta:
        model = Listing
        fields = [
            'id',
            'title',
            'price',
            'addr',
            'lat',
            'lng',
            'img',
            'type',
        ]
    
    def get_title(self, obj):
        """매물 타입과 가격을 조합한 제목 생성"""
        listing_type = obj.get_매물타입_display()
        if obj.매물타입 == 'sale' and obj.매매가:
            price_text = f"{obj.매매가 / 100000000:.1f}억"
        elif obj.매물타입 == 'jeonse' and obj.전세보증금:
            price_text = f"{obj.전세보증금 / 100000000:.1f}억"
        elif obj.매물타입 == 'monthly' and obj.월세:
            deposit_text = f"{obj.월세보증금 / 10000:.0f}" if obj.월세보증금 else "0"
            rent_text = f"{obj.월세 / 10000:.0f}"
            price_text = f"{deposit_text}/{rent_text}"
        else:
            price_text = "-"
        
        return f"{listing_type} {price_text}"
    
    def get_price(self, obj):
        """가격 텍스트 생성"""
        if obj.매물타입 == 'sale' and obj.매매가:
            return f"{obj.매매가 / 100000000:.2f}억"
        elif obj.매물타입 == 'jeonse' and obj.전세보증금:
            return f"{obj.전세보증금 / 100000000:.2f}억"
        elif obj.매물타입 == 'monthly' and obj.월세:
            deposit = f"{obj.월세보증금 / 10000:.0f}" if obj.월세보증금 else "0"
            rent = f"{obj.월세 / 10000:.0f}"
            return f"{deposit}/{rent}"
        return "-"
    
    def get_img(self, obj):
        """대표 이미지 반환 (첫 번째 이미지)"""
        if obj.이미지URLs and len(obj.이미지URLs) > 0:
            return obj.이미지URLs[0]
        return None


class ListingDetailSerializer(serializers.ModelSerializer):
    """
    매물 상세 정보용 Serializer
    """
    # 프론트엔드 필드명으로 매핑
    listing_type = serializers.CharField(source='매물타입')
    house_type = serializers.CharField(source='주택종류', allow_null=True)
    sale_price = serializers.IntegerField(source='매매가', allow_null=True)
    jeonse_price = serializers.IntegerField(source='전세보증금', allow_null=True)
    monthly_deposit = serializers.IntegerField(source='월세보증금', allow_null=True)
    monthly_rent = serializers.IntegerField(source='월세', allow_null=True)
    address = serializers.CharField(source='주소')
    maintenance_fee_monthly = serializers.IntegerField(source='월관리비', allow_null=True)
    parking_info = serializers.CharField(source='주차정보', allow_null=True)
    exclusive_area_sqm = serializers.DecimalField(source='전용면적_제곱미터', max_digits=10, decimal_places=2, allow_null=True)
    exclusive_area_pyeong = serializers.DecimalField(source='전용면적_평', max_digits=10, decimal_places=2, allow_null=True)
    rooms = serializers.IntegerField(source='방수', allow_null=True)
    bathrooms = serializers.IntegerField(source='욕실수', allow_null=True)
    floor = serializers.CharField(source='층수', allow_null=True)
    built_year = serializers.IntegerField(source='준공년도', allow_null=True)
    supply_area_sqm = serializers.DecimalField(source='공급면적_제곱미터', max_digits=10, decimal_places=2, allow_null=True)
    orientation = serializers.CharField(source='방향', allow_null=True)
    household_total = serializers.IntegerField(source='총세대수', allow_null=True)
    parking_total = serializers.IntegerField(source='총주차대수', allow_null=True)
    entrance_type = serializers.CharField(source='현관유형', allow_null=True)
    move_in_date = serializers.CharField(source='입주가능일', allow_null=True)
    building_use = serializers.CharField(source='건축물용도', allow_null=True)
    approval_date = serializers.DateField(source='사용승인일', allow_null=True)
    first_registered_at = serializers.DateField(source='최초등록일', allow_null=True)
    contract_term_months = serializers.IntegerField(source='계약기간_개월', allow_null=True)
    renewable = serializers.BooleanField(source='재계약가능여부', allow_null=True)
    
    # JSON 필드
    public_transport_score = serializers.IntegerField(source='대중교통점수', allow_null=True)
    line_variety_score = serializers.IntegerField(source='노선다양성점수', allow_null=True)
    bus_stops = serializers.JSONField(source='버스정류장정보', allow_null=True)
    stations = serializers.JSONField(source='지하철역정보', allow_null=True)
    amenity_summary = serializers.CharField(source='편의시설요약', allow_null=True)
    images = serializers.JSONField(source='이미지URLs', allow_null=True)
    qa = serializers.JSONField(source='QA정보', allow_null=True)
    
    class Meta:
        model = Listing
        fields = [
            'listing_type', 'house_type', 'sale_price', 'jeonse_price', 'monthly_deposit', 'monthly_rent',
            'address', 'maintenance_fee_monthly', 'parking_info',
            'exclusive_area_sqm', 'exclusive_area_pyeong', 'rooms', 'bathrooms',
            'floor', 'built_year', 'supply_area_sqm', 'orientation',
            'household_total', 'parking_total', 'entrance_type',
            'move_in_date', 'building_use', 'approval_date', 'first_registered_at',
            'contract_term_months', 'renewable',
            'public_transport_score', 'line_variety_score', 'bus_stops', 'stations',
            'amenity_summary', 'images', 'qa',
        ]

