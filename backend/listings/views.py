from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing
from .serializers import ListingListSerializer, ListingDetailSerializer


class ListingViewSet(viewsets.ModelViewSet):
    """
    매물 ViewSet
    
    - list: 지도 범위 내 매물 목록 조회 (공개)
    - retrieve: 매물 상세 정보 조회 (공개)
    - create/update/delete: 관리자용 (추후 권한 추가)
    """
    queryset = Listing.objects.filter(활성화여부=True, 매물상태='available')
    serializer_class = ListingDetailSerializer
    permission_classes = [AllowAny]  # 공개 API
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['매물타입', '주택종류', '지역ID']
    search_fields = ['주소', '도로명주소', '지번주소']
    ordering_fields = ['생성일시', '조회수', '찜수']
    
    def get_serializer_class(self):
        """액션에 따라 다른 Serializer 사용"""
        if self.action == 'list':
            return ListingListSerializer
        return ListingDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/listings?bounds=sw_lat,sw_lng,ne_lat,ne_lng
        
        지도 범위 내 매물 목록 조회
        
        Query Parameters:
            - bounds: 지도 남서-북동 좌표 (예: 34.999,126.999,35.002,127.001)
        
        Response:
            {
                "listings": [
                    {
                        "id": "1",
                        "title": "전세 2억 5500",
                        "price": "2.55억",
                        "addr": "무주읍 적천로 343",
                        "lat": 35.0,
                        "lng": 127.0,
                        "img": "/images/house1.jpg"
                    }
                ]
            }
        """
        bounds = request.query_params.get('bounds')
        
        queryset = self.filter_queryset(self.get_queryset())
        
        # 지도 범위 필터링
        if bounds:
            try:
                sw_lat, sw_lng, ne_lat, ne_lng = map(float, bounds.split(','))
                queryset = queryset.filter(
                    위도__gte=sw_lat,
                    위도__lte=ne_lat,
                    경도__gte=sw_lng,
                    경도__lte=ne_lng
                )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid bounds format. Expected: sw_lat,sw_lng,ne_lat,ne_lng'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # 페이지네이션
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'listings': serializer.data})
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/listings/{id}
        
        매물 상세 정보 조회
        
        Response:
            {
                "listing_type": "전세",
                "jeonse_price": 320000000,
                "address": "서울특별시 강남구 테헤란로 123",
                "maintenance_fee_monthly": 120000,
                "parking_info": "주차 1대",
                "exclusive_area_sqm": 84.97,
                "exclusive_area_pyeong": 25.72,
                "rooms": 3,
                "bathrooms": 2,
                "floor": "12/25",
                "built_year": 2008,
                ...
            }
        """
        instance = self.get_object()
        
        # 조회수 증가
        instance.조회수 += 1
        instance.save(update_fields=['조회수'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
