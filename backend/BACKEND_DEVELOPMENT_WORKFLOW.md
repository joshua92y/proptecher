# Backend 개발 워크플로우 문서

## 📌 프로젝트 개요

**프로젝트명**: PropTecher Backend (부동산 플랫폼 백엔드)  
**기술 스택**: Django 5.2.6, Django REST Framework, PostGIS, Celery, Redis/Dragonfly  
**데이터베이스**: PostgreSQL + PostGIS (공간 데이터)  
**캐시/브로커**: Redis/Dragonfly  

---

## 🏗️ 프로젝트 구조

```
backend/
├── config/                 # Django 프로젝트 설정
│   ├── settings.py        # 메인 설정 파일
│   ├── urls.py            # 전역 URL 라우팅
│   ├── celery.py          # Celery 설정
│   ├── asgi.py            # ASGI 설정 (WebSocket)
│   └── wsgi.py            # WSGI 설정
│
├── accounts/              # 계정 관리 (미구현)
├── users/                 # 사용자 프로필 관리
│   └── models.py          # UserProfile 모델
│
├── agents/                # 중개사(평가사) 관리
│   └── models.py          # Agent 모델
│
├── listings/              # 매물 관리 ⭐ 핵심
│   ├── models.py          # Listing 모델
│   ├── views.py           # API 뷰 (구현 필요)
│   ├── serializers.py     # DRF Serializer (구현 필요)
│   └── urls.py            # URL 라우팅 (구현 필요)
│
├── regions/               # 지역 관리
│   └── models.py          # Region 모델
│
├── locations/             # 공간 데이터 관리 (GeoDjango)
│   ├── models.py          # Sido 모델 (시도 경계)
│   ├── views.py           # TopoJSON API
│   └── urls.py            # locations API
│
├── properties/            # 부동산 DB 관리 (미구현)
│
├── manage.py              # Django 관리 명령어
├── requirements.txt       # Python 패키지 목록
├── db.sqlite3             # SQLite (개발용)
└── venv/                  # 가상환경
```

---

## 🎯 프론트엔드 요구사항 분석

### 프론트엔드가 요청하는 API 목록

프론트엔드 문서(`frontend/FRONTEND_DOCUMENTATION.md`)를 기반으로 필요한 API 엔드포인트:

#### 1️⃣ 매물(Listing) API

| 엔드포인트 | 메서드 | 설명 | 우선순위 |
|-----------|--------|------|---------|
| `/api/listings` | GET | 지도 범위 내 매물 목록 조회 | 🔴 High |
| `/api/listings/{id}` | GET | 매물 상세 정보 조회 | 🔴 High |
| `/api/listings` | POST | 새 매물 등록 | 🟡 Medium |
| `/api/listings/{id}` | PUT/PATCH | 매물 정보 수정 | 🟡 Medium |
| `/api/listings/{id}` | DELETE | 매물 삭제 | 🟢 Low |

#### 2️⃣ 임장(Inspection) API

| 엔드포인트 | 메서드 | 설명 | 우선순위 |
|-----------|--------|------|---------|
| `/api/inspections/requests` | POST | 임장 요청 생성 (소비자) | 🔴 High |
| `/api/inspections/status` | GET | 매물의 임장 상태 조회 | 🔴 High |
| `/api/admin/inspections/requests` | GET | 임장 요청 목록 (평가사) | 🔴 High |
| `/api/admin/inspections/requests/{id}` | GET | 임장 요청 상세 | 🔴 High |
| `/api/admin/inspections/{id}/accept` | POST | 임장 요청 수락 | 🔴 High |
| `/api/admin/inspections/{id}/reject` | POST | 임장 요청 거절 | 🔴 High |
| `/api/admin/inspections/active` | GET | 진행중인 임장 목록 | 🔴 High |
| `/api/admin/inspections/{id}/cancel` | POST | 임장 취소 | 🟡 Medium |
| `/api/admin/inspections/progress/{id}` | GET | 임장 진행 상황 조회 | 🟢 Low |

#### 3️⃣ 사용자(User) API

| 엔드포인트 | 메서드 | 설명 | 우선순위 |
|-----------|--------|------|---------|
| `/api/auth/login` | POST | 로그인 | 🟡 Medium |
| `/api/auth/logout` | POST | 로그아웃 | 🟡 Medium |
| `/api/auth/register` | POST | 회원가입 | 🟡 Medium |
| `/api/admin/profile` | GET | 평가사 프로필 조회 | 🟡 Medium |
| `/api/user/profile` | GET | 사용자 프로필 조회 | 🟢 Low |

#### 4️⃣ 기타 API

| 엔드포인트 | 메서드 | 설명 | 우선순위 |
|-----------|--------|------|---------|
| `/api/admin/notices` | GET | 공지사항 목록 | 🟢 Low |
| `/api/regions` | GET | 지역 목록 조회 | 🟢 Low |

---

## 📊 데이터 모델 분석

### 1. Listing 모델 (매물)

**파일**: `backend/listings/models.py`

#### 주요 필드 매핑 (프론트엔드 ↔ 백엔드)

| 프론트엔드 필드 | 백엔드 필드 | 타입 | 비고 |
|----------------|------------|------|------|
| `listing_type` | `매물타입` | CharField | "전세", "월세", "매매" |
| `sale_price` | `매매가` | BigIntegerField | 매매가(원) |
| `jeonse_price` | `전세보증금` | BigIntegerField | 전세보증금(원) |
| `monthly_deposit` | `월세보증금` | BigIntegerField | 월세 보증금(원) |
| `monthly_rent` | `월세` | BigIntegerField | 월세(원) |
| `address` | `주소` | TextField | 전체 주소 |
| `maintenance_fee_monthly` | `월관리비` | IntegerField | 월 관리비(원) |
| `parking_info` | `주차정보` | TextField | 주차 정보 |
| `exclusive_area_sqm` | `전용면적_제곱미터` | DecimalField | 전용면적(㎡) |
| `exclusive_area_pyeong` | `전용면적_평` | DecimalField | 전용면적(평) |
| `rooms` | `방수` | PositiveSmallIntegerField | 방 개수 |
| `bathrooms` | `욕실수` | PositiveSmallIntegerField | 욕실 개수 |
| `floor` | `층수` | CharField | 층수 정보 (예: "12/25") |
| `built_year` | `준공년도` | PositiveSmallIntegerField | 준공 연도 |
| `supply_area_sqm` | `공급면적_제곱미터` | DecimalField | 공급면적(㎡) |
| `orientation` | `방향` | CharField | 방향 (동서남북) |
| `household_total` | `총세대수` | PositiveIntegerField | 총 세대수 |
| `parking_total` | `총주차대수` | PositiveIntegerField | 총 주차대수 |
| `entrance_type` | `현관유형` | CharField | 현관 유형 |
| `move_in_date` | `입주가능일` | CharField | 입주 가능일 |
| `building_use` | `건축물용도` | CharField | 건축물 용도 |
| `approval_date` | `사용승인일` | DateField | 사용승인일 |
| `first_registered_at` | `최초등록일` | DateField | 최초 등록일 |
| `contract_term_months` | `계약기간_개월` | PositiveSmallIntegerField | 계약 기간(개월) |
| `renewable` | `재계약가능여부` | BooleanField | 재계약 가능 여부 |
| `lat` | `위도` | DecimalField | 위도 좌표 |
| `lng` | `경도` | DecimalField | 경도 좌표 |

#### ⚠️ 추가 필요 필드

프론트엔드 요구사항에는 있지만 현재 모델에 없는 필드:

```python
# listings/models.py에 추가 필요

class Listing(models.Model):
    # ... 기존 필드들 ...
    
    # 교통 정보 (JSON 필드로 저장)
    대중교통점수 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='대중교통 편의성 점수(0-10)'
    )
    노선다양성점수 = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='노선 다양성 점수(0-5)'
    )
    버스정류장정보 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='버스 정류장 정보'
    )
    # 예시: [{"stop_name": "선릉역", "distance_m": 180, "bus_numbers": ["146", "341"]}]
    
    지하철역정보 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='지하철역 정보'
    )
    # 예시: [{"station_name": "선릉역", "line_names": ["2호선"], "distance_m": 420}]
    
    # 편의시설 정보
    편의시설요약 = models.TextField(
        null=True,
        blank=True,
        verbose_name='편의시설 및 상권 요약'
    )
    
    # 이미지 (JSONField로 여러 이미지 URL 저장)
    이미지URLs = models.JSONField(
        null=True,
        blank=True,
        verbose_name='매물 이미지 URL 목록'
    )
    # 예시: ["/images/house1.jpg", "/images/house2.jpg"]
    
    # Q&A (별도 모델로 분리하는 것이 권장)
    QA정보 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Q&A 정보'
    )
```

---

### 2. Inspection 모델 (임장) - 새로 생성 필요

**파일**: `backend/inspections/models.py` (새로 생성)

```python
from django.db import models
from django.conf import settings


class InspectionRequest(models.Model):
    """
    임장 요청 모델 (소비자 → 평가사)
    """
    STATUS_CHOICES = [
        ('requested', '요청됨'),
        ('accepted', '수락됨'),
        ('rejected', '거절됨'),
        ('cancelled', '취소됨'),
        ('completed', '완료됨'),
    ]
    
    # 관계
    매물ID = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='inspection_requests',
        verbose_name='매물'
    )
    요청자ID = models.ForeignKey(
        'users.UserProfile',
        on_delete=models.CASCADE,
        related_name='my_inspection_requests',
        verbose_name='요청자'
    )
    담당평가사ID = models.ForeignKey(
        'agents.Agent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_inspections',
        verbose_name='담당 평가사'
    )
    
    # 요청 정보
    희망날짜 = models.DateField(
        verbose_name='희망 임장 날짜'
    )
    연락처 = models.CharField(
        max_length=20,
        verbose_name='연락처'
    )
    요청사항 = models.TextField(
        null=True,
        blank=True,
        verbose_name='요청 사항'
    )
    
    # 매물 정보 스냅샷 (매물 삭제 시에도 기록 유지)
    매물제목 = models.CharField(
        max_length=200,
        verbose_name='매물 제목'
    )
    매물주소 = models.TextField(
        verbose_name='매물 주소'
    )
    가격정보 = models.CharField(
        max_length=100,
        verbose_name='가격 정보 텍스트'
    )
    임장비 = models.IntegerField(
        default=150000,
        verbose_name='임장비(원)'
    )
    매물이미지URL = models.TextField(
        null=True,
        blank=True,
        verbose_name='매물 대표 이미지 URL'
    )
    
    # 매물 상세 정보
    매물설명 = models.TextField(
        null=True,
        blank=True,
        verbose_name='매물 설명'
    )
    특이사항 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='특이사항 목록'
    )
    현재사진URLs = models.JSONField(
        null=True,
        blank=True,
        verbose_name='현재 사진 URL 목록'
    )
    
    # 상태
    상태 = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='requested',
        verbose_name='요청 상태'
    )
    
    # 타임스탬프
    요청일시 = models.DateTimeField(
        auto_now_add=True,
        verbose_name='요청 일시'
    )
    수락일시 = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='수락 일시'
    )
    완료일시 = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='완료 일시'
    )
    
    class Meta:
        verbose_name = '임장 요청'
        verbose_name_plural = '임장 요청'
        db_table = 'inspection_requests'
        ordering = ['-요청일시']
    
    def __str__(self):
        return f"{self.매물제목} - {self.get_상태_display()}"


class ActiveInspection(models.Model):
    """
    진행중인 임장 모델 (평가사가 수락한 임장)
    """
    # 관계
    요청ID = models.OneToOneField(
        InspectionRequest,
        on_delete=models.CASCADE,
        related_name='active_inspection',
        verbose_name='임장 요청'
    )
    평가사ID = models.ForeignKey(
        'agents.Agent',
        on_delete=models.CASCADE,
        related_name='active_inspections',
        verbose_name='담당 평가사'
    )
    
    # 진행 상태
    진행률 = models.IntegerField(
        default=0,
        verbose_name='진행률(%)'
    )
    
    # 평면도 및 리포트 (파일 경로 또는 URL)
    평면도URL = models.TextField(
        null=True,
        blank=True,
        verbose_name='평면도 이미지 URL'
    )
    리포트URL = models.TextField(
        null=True,
        blank=True,
        verbose_name='임장 리포트 URL'
    )
    
    # 메모
    평가사메모 = models.TextField(
        null=True,
        blank=True,
        verbose_name='평가사 메모'
    )
    
    # 타임스탬프
    시작일시 = models.DateTimeField(
        auto_now_add=True,
        verbose_name='시작 일시'
    )
    수정일시 = models.DateTimeField(
        auto_now=True,
        verbose_name='수정 일시'
    )
    
    class Meta:
        verbose_name = '진행중인 임장'
        verbose_name_plural = '진행중인 임장'
        db_table = 'active_inspections'
        ordering = ['-시작일시']
    
    def __str__(self):
        return f"{self.요청ID.매물제목} - {self.진행률}%"


class InspectionCancellation(models.Model):
    """
    임장 취소 기록
    """
    # 관계
    임장ID = models.ForeignKey(
        ActiveInspection,
        on_delete=models.CASCADE,
        related_name='cancellations',
        verbose_name='취소된 임장'
    )
    평가사ID = models.ForeignKey(
        'agents.Agent',
        on_delete=models.CASCADE,
        verbose_name='취소한 평가사'
    )
    
    # 취소 정보
    취소사유 = models.TextField(
        verbose_name='취소 사유'
    )
    재요청여부 = models.BooleanField(
        default=True,
        verbose_name='재요청 가능 여부'
    )
    
    # 타임스탬프
    취소일시 = models.DateTimeField(
        auto_now_add=True,
        verbose_name='취소 일시'
    )
    
    class Meta:
        verbose_name = '임장 취소'
        verbose_name_plural = '임장 취소'
        db_table = 'inspection_cancellations'
        ordering = ['-취소일시']
```

---

### 3. Notice 모델 (공지사항) - 새로 생성 필요

**파일**: `backend/notices/models.py` (새로 생성)

```python
from django.db import models


class Notice(models.Model):
    """
    공지사항 모델
    """
    TARGET_CHOICES = [
        ('all', '전체'),
        ('user', '소비자'),
        ('agent', '평가사'),
    ]
    
    제목 = models.CharField(
        max_length=200,
        verbose_name='공지 제목'
    )
    내용 = models.TextField(
        verbose_name='공지 내용'
    )
    대상 = models.CharField(
        max_length=20,
        choices=TARGET_CHOICES,
        default='all',
        verbose_name='공지 대상'
    )
    신규여부 = models.BooleanField(
        default=True,
        verbose_name='신규 여부'
    )
    활성화여부 = models.BooleanField(
        default=True,
        verbose_name='활성화 여부'
    )
    작성자ID = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='작성자'
    )
    
    # 타임스탬프
    작성일시 = models.DateTimeField(
        auto_now_add=True,
        verbose_name='작성 일시'
    )
    수정일시 = models.DateTimeField(
        auto_now=True,
        verbose_name='수정 일시'
    )
    
    class Meta:
        verbose_name = '공지사항'
        verbose_name_plural = '공지사항'
        db_table = 'notices'
        ordering = ['-작성일시']
    
    def __str__(self):
        return self.제목
```

---

## 🚀 개발 단계별 가이드

### Phase 1: 환경 설정 및 앱 생성 (1-2일)

#### 1.1 새 앱 생성

```bash
cd backend
python manage.py startapp inspections
python manage.py startapp notices
```

#### 1.2 settings.py 업데이트

```python
# backend/config/settings.py

LOCAL_APPS = [
    "locations",
    "accounts",
    "properties",
    "users",
    "agents",
    "regions",
    "listings",
    "inspections",    # 추가
    "notices",        # 추가
]
```

#### 1.3 모델 생성 및 마이그레이션

```bash
# 1. Inspection 모델 추가
# backend/inspections/models.py 파일 작성

# 2. Notice 모델 추가
# backend/notices/models.py 파일 작성

# 3. Listing 모델 필드 추가
# backend/listings/models.py 파일 수정

# 4. 마이그레이션 파일 생성
python manage.py makemigrations

# 5. 마이그레이션 실행
python manage.py migrate
```

---

### Phase 2: Listing API 개발 (3-4일) 🔴 High Priority

#### 2.1 Serializer 작성

**파일**: `backend/listings/serializers.py` (새로 생성)

```python
from rest_framework import serializers
from .models import Listing


class ListingListSerializer(serializers.ModelSerializer):
    """
    매물 목록용 Serializer (지도에 표시할 간단한 정보)
    """
    lat = serializers.DecimalField(source='위도', max_digits=10, decimal_places=8)
    lng = serializers.DecimalField(source='경도', max_digits=11, decimal_places=8)
    
    class Meta:
        model = Listing
        fields = [
            'id',
            'title',  # 계산 필드 추가 필요
            'price',  # 계산 필드 추가 필요
            'addr',   # 주소 필드 매핑
            'lat',
            'lng',
            'img',    # 대표 이미지 필드 추가 필요
        ]


class ListingDetailSerializer(serializers.ModelSerializer):
    """
    매물 상세 정보용 Serializer
    """
    # 프론트엔드 필드명으로 매핑
    listing_type = serializers.CharField(source='매물타입')
    sale_price = serializers.IntegerField(source='매매가', allow_null=True)
    jeonse_price = serializers.IntegerField(source='전세보증금', allow_null=True)
    monthly_deposit = serializers.IntegerField(source='월세보증금', allow_null=True)
    monthly_rent = serializers.IntegerField(source='월세', allow_null=True)
    address = serializers.CharField(source='주소')
    maintenance_fee_monthly = serializers.IntegerField(source='월관리비')
    parking_info = serializers.CharField(source='주차정보')
    exclusive_area_sqm = serializers.DecimalField(source='전용면적_제곱미터', max_digits=10, decimal_places=2)
    exclusive_area_pyeong = serializers.DecimalField(source='전용면적_평', max_digits=10, decimal_places=2)
    rooms = serializers.IntegerField(source='방수')
    bathrooms = serializers.IntegerField(source='욕실수')
    floor = serializers.CharField(source='층수')
    built_year = serializers.IntegerField(source='준공년도')
    supply_area_sqm = serializers.DecimalField(source='공급면적_제곱미터', max_digits=10, decimal_places=2)
    orientation = serializers.CharField(source='방향')
    household_total = serializers.IntegerField(source='총세대수')
    parking_total = serializers.IntegerField(source='총주차대수')
    entrance_type = serializers.CharField(source='현관유형')
    move_in_date = serializers.CharField(source='입주가능일')
    building_use = serializers.CharField(source='건축물용도')
    approval_date = serializers.DateField(source='사용승인일')
    first_registered_at = serializers.DateField(source='최초등록일')
    contract_term_months = serializers.IntegerField(source='계약기간_개월')
    renewable = serializers.BooleanField(source='재계약가능여부')
    
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
            'listing_type', 'sale_price', 'jeonse_price', 'monthly_deposit', 'monthly_rent',
            'address', 'maintenance_fee_monthly', 'parking_info',
            'exclusive_area_sqm', 'exclusive_area_pyeong', 'rooms', 'bathrooms',
            'floor', 'built_year', 'supply_area_sqm', 'orientation',
            'household_total', 'parking_total', 'entrance_type',
            'move_in_date', 'building_use', 'approval_date', 'first_registered_at',
            'contract_term_months', 'renewable',
            'public_transport_score', 'line_variety_score', 'bus_stops', 'stations',
            'amenity_summary', 'images', 'qa',
        ]
```

#### 2.2 View 작성

**파일**: `backend/listings/views.py`

```python
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing
from .serializers import ListingListSerializer, ListingDetailSerializer


class ListingViewSet(viewsets.ModelViewSet):
    """
    매물 ViewSet
    """
    queryset = Listing.objects.filter(활성화여부=True, 매물상태='available')
    serializer_class = ListingDetailSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['매물타입', '주택종류', '지역ID']
    search_fields = ['주소', '도로명주소', '지번주소']
    ordering_fields = ['생성일시', '조회수', '찜수']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ListingListSerializer
        return ListingDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/listings?bounds=sw_lat,sw_lng,ne_lat,ne_lng
        지도 범위 내 매물 목록 조회
        """
        bounds = request.query_params.get('bounds')
        
        queryset = self.filter_queryset(self.get_queryset())
        
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
                pass
        
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
        """
        instance = self.get_object()
        
        # 조회수 증가
        instance.조회수 += 1
        instance.save(update_fields=['조회수'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
```

#### 2.3 URL 라우팅

**파일**: `backend/listings/urls.py` (새로 생성)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')

urlpatterns = [
    path('', include(router.urls)),
]
```

**파일**: `backend/config/urls.py` (수정)

```python
url = [
    path("admin/", admin.site.urls),
    path("api/locations/", include("locations.urls")),
    path("api/", include("listings.urls")),  # 추가
]
```

---

### Phase 3: Inspection API 개발 (4-5일) 🔴 High Priority

#### 3.1 Serializer 작성

**파일**: `backend/inspections/serializers.py` (새로 생성)

```python
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
        validated_data['요청자ID'] = user.profile
        
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
```

#### 3.2 View 작성

**파일**: `backend/inspections/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import InspectionRequest, ActiveInspection, InspectionCancellation
from .serializers import (
    InspectionRequestCreateSerializer,
    RequestCardSerializer,
    RequestDetailSerializer,
    ActiveInspectionSerializer,
    InspectionStatusSerializer,
)


class InspectionViewSet(viewsets.ViewSet):
    """
    임장 관련 ViewSet
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='requests')
    def create_request(self, request):
        """
        POST /api/inspections/requests
        임장 요청 생성 (소비자)
        """
        serializer = InspectionRequestCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        inspection = serializer.save()
        
        return Response({
            'request_id': str(inspection.id),
            'status': 'requested'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='status')
    def get_status(self, request):
        """
        GET /api/inspections/status?listing_id={listing_id}
        매물의 임장 상태 조회
        """
        listing_id = request.query_params.get('listing_id')
        if not listing_id:
            return Response({'error': 'listing_id is required'}, status=400)
        
        # 사용자의 요청 중 해당 매물에 대한 최신 요청 조회
        inspection = InspectionRequest.objects.filter(
            매물ID__id=listing_id,
            요청자ID=request.user.profile
        ).order_by('-요청일시').first()
        
        if not inspection:
            return Response({'status': None})
        
        # 상태 판단
        if inspection.상태 == 'requested':
            inspection_status = 'requested'
        elif inspection.상태 == 'accepted' and hasattr(inspection, 'active_inspection'):
            inspection_status = 'active'
        else:
            inspection_status = None
        
        serializer = InspectionStatusSerializer({'status': inspection_status})
        return Response(serializer.data)


class AdminInspectionViewSet(viewsets.ViewSet):
    """
    평가사용 임장 관리 ViewSet
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='requests')
    def list_requests(self, request):
        """
        GET /api/admin/inspections/requests
        임장 요청 목록 조회 (평가사)
        """
        # 평가사 인증 확인
        if not hasattr(request.user.profile, 'agent_profile'):
            return Response({'error': 'Agent only'}, status=403)
        
        # 요청된 상태의 임장만 조회
        requests = InspectionRequest.objects.filter(
            상태='requested'
        ).select_related('매물ID')
        
        serializer = RequestCardSerializer(requests, many=True)
        return Response({'requests': serializer.data})
    
    @action(detail=True, methods=['get'], url_path='requests/(?P<request_id>[^/.]+)')
    def request_detail(self, request, request_id=None):
        """
        GET /api/admin/inspections/requests/{request_id}
        임장 요청 상세 조회
        """
        try:
            inspection = InspectionRequest.objects.get(id=request_id)
        except InspectionRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        
        serializer = RequestDetailSerializer(inspection)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='(?P<request_id>[^/.]+)/accept')
    def accept_request(self, request, request_id=None):
        """
        POST /api/admin/inspections/{request_id}/accept
        임장 요청 수락
        """
        try:
            inspection = InspectionRequest.objects.get(id=request_id, 상태='requested')
        except InspectionRequest.DoesNotExist:
            return Response({'error': 'Request not found or already processed'}, status=400)
        
        # 평가사 프로필 가져오기
        agent = request.user.profile.agent_profile
        
        # 요청 상태 업데이트
        inspection.상태 = 'accepted'
        inspection.담당평가사ID = agent
        inspection.수락일시 = timezone.now()
        inspection.save()
        
        # ActiveInspection 생성
        active = ActiveInspection.objects.create(
            요청ID=inspection,
            평가사ID=agent,
            진행률=0
        )
        
        return Response({
            'inspectionId': str(active.id),
            'status': 'active'
        })
    
    @action(detail=True, methods=['post'], url_path='(?P<request_id>[^/.]+)/reject')
    def reject_request(self, request, request_id=None):
        """
        POST /api/admin/inspections/{request_id}/reject
        임장 요청 거절
        """
        try:
            inspection = InspectionRequest.objects.get(id=request_id, 상태='requested')
        except InspectionRequest.DoesNotExist:
            return Response({'error': 'Request not found or already processed'}, status=400)
        
        inspection.상태 = 'rejected'
        inspection.save()
        
        return Response({'status': 'rejected'})
    
    @action(detail=False, methods=['get'], url_path='active')
    def list_active(self, request):
        """
        GET /api/admin/inspections/active
        진행중인 임장 목록
        """
        agent = request.user.profile.agent_profile
        
        active_inspections = ActiveInspection.objects.filter(
            평가사ID=agent
        ).select_related('요청ID')
        
        serializer = ActiveInspectionSerializer(active_inspections, many=True)
        return Response({'active': serializer.data})
    
    @action(detail=True, methods=['post'], url_path='(?P<inspection_id>[^/.]+)/cancel')
    def cancel_active(self, request, inspection_id=None):
        """
        POST /api/admin/inspections/{inspection_id}/cancel
        임장 취소
        """
        try:
            active = ActiveInspection.objects.get(id=inspection_id)
        except ActiveInspection.DoesNotExist:
            return Response({'error': 'Active inspection not found'}, status=404)
        
        reason = request.data.get('reason', '')
        requeue = request.data.get('requeue', True)
        
        # 취소 기록 생성
        InspectionCancellation.objects.create(
            임장ID=active,
            평가사ID=active.평가사ID,
            취소사유=reason,
            재요청여부=requeue
        )
        
        # 요청 상태 업데이트
        inspection_request = active.요청ID
        if requeue:
            inspection_request.상태 = 'requested'  # 재요청 가능
        else:
            inspection_request.상태 = 'cancelled'
        inspection_request.save()
        
        # ActiveInspection 삭제
        active.delete()
        
        return Response({
            'status': 'cancelled',
            'requeued': requeue
        })
```

#### 3.3 URL 라우팅

**파일**: `backend/inspections/urls.py` (새로 생성)

```python
from django.urls import path
from .views import InspectionViewSet, AdminInspectionViewSet

urlpatterns = [
    # 소비자용
    path('inspections/requests', 
         InspectionViewSet.as_view({'post': 'create_request'}),
         name='inspection-create-request'),
    path('inspections/status',
         InspectionViewSet.as_view({'get': 'get_status'}),
         name='inspection-status'),
    
    # 평가사용
    path('admin/inspections/requests',
         AdminInspectionViewSet.as_view({'get': 'list_requests'}),
         name='admin-inspection-requests'),
    path('admin/inspections/requests/<str:request_id>',
         AdminInspectionViewSet.as_view({'get': 'request_detail'}),
         name='admin-inspection-request-detail'),
    path('admin/inspections/<str:request_id>/accept',
         AdminInspectionViewSet.as_view({'post': 'accept_request'}),
         name='admin-inspection-accept'),
    path('admin/inspections/<str:request_id>/reject',
         AdminInspectionViewSet.as_view({'post': 'reject_request'}),
         name='admin-inspection-reject'),
    path('admin/inspections/active',
         AdminInspectionViewSet.as_view({'get': 'list_active'}),
         name='admin-inspection-active'),
    path('admin/inspections/<str:inspection_id>/cancel',
         AdminInspectionViewSet.as_view({'post': 'cancel_active'}),
         name='admin-inspection-cancel'),
]
```

**파일**: `backend/config/urls.py` (수정)

```python
url = [
    path("admin/", admin.site.urls),
    path("api/locations/", include("locations.urls")),
    path("api/", include("listings.urls")),
    path("api/", include("inspections.urls")),  # 추가
]
```

---

### Phase 4: 인증 및 사용자 API 개발 (2-3일) 🟡 Medium Priority

#### 4.1 JWT 인증 설정

```bash
pip install djangorestframework-simplejwt
```

**파일**: `backend/config/settings.py` (수정)

```python
from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # ... 기존 설정
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

#### 4.2 인증 API

**파일**: `backend/users/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile
from agents.models import Agent


class AuthViewSet(viewsets.ViewSet):
    """
    인증 ViewSet
    """
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        POST /api/auth/login
        로그인
        """
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_type': user.profile.사용자유형,
        })
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        POST /api/auth/register
        회원가입
        """
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        user_type = request.data.get('user_type', 'user')
        
        # 사용자 생성
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )
        
        # 프로필 생성
        profile = UserProfile.objects.create(
            user=user,
            사용자유형=user_type
        )
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_type': profile.사용자유형,
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """
        POST /api/auth/logout
        로그아웃
        """
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileViewSet(viewsets.ViewSet):
    """
    프로필 ViewSet
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='admin/profile')
    def admin_profile(self, request):
        """
        GET /api/admin/profile
        평가사 프로필 조회
        """
        try:
            agent = request.user.profile.agent_profile
        except:
            return Response({'error': 'Not an agent'}, status=403)
        
        return Response({
            'name': agent.대표자명,
            'rating': float(agent.평점),
            'completed_count': agent.완료임장수,
            'region': agent.서비스지역,
            'experience_years': 3,  # 계산 필요
            'avatar_url': request.user.profile.프로필이미지URL,
        })
    
    @action(detail=False, methods=['get'], url_path='user/profile')
    def user_profile(self, request):
        """
        GET /api/user/profile
        사용자 프로필 조회
        """
        profile = request.user.profile
        
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'phone': profile.연락처,
            'avatar_url': profile.프로필이미지URL,
        })
```

---

### Phase 5: Notice API 개발 (1-2일) 🟢 Low Priority

**파일**: `backend/notices/views.py`

```python
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
```

---

## 🧪 테스트 가이드

### 수동 테스트

#### 1. Django Shell로 데이터 생성

```python
python manage.py shell

from listings.models import Listing
from users.models import UserProfile
from agents.models import Agent
from django.contrib.auth.models import User

# 테스트 매물 생성
listing = Listing.objects.create(
    매물타입='jeonse',
    주택종류='apartment',
    전세보증금=320000000,
    주소='서울특별시 강남구 테헤란로 123',
    월관리비=120000,
    주차정보='주차 1대',
    전용면적_제곱미터=84.97,
    전용면적_평=25.72,
    방수=3,
    욕실수=2,
    층수='12/25',
    준공년도=2008,
    # ... 기타 필드
)
```

#### 2. API 테스트 (httpie 사용)

```bash
# 매물 목록 조회
http GET http://localhost:8000/api/listings/

# 매물 상세 조회
http GET http://localhost:8000/api/listings/1/

# 로그인
http POST http://localhost:8000/api/auth/login username=testuser password=testpass

# 임장 요청 생성
http POST http://localhost:8000/api/inspections/requests \
  "Authorization: Bearer {access_token}" \
  listing_id=1 \
  title="전세 3.2억" \
  address="서울특별시 강남구" \
  priceText="3.2억" \
  preferred_date="2025-12-20" \
  contact_phone="010-1234-5678"
```

---

## 📝 개발 체크리스트

### Phase 1: 환경 설정
- [ ] `inspections` 앱 생성
- [ ] `notices` 앱 생성
- [ ] 모델 작성 (InspectionRequest, ActiveInspection, Notice)
- [ ] Listing 모델 필드 추가 (대중교통점수, 버스정류장정보 등)
- [ ] 마이그레이션 실행

### Phase 2: Listing API
- [ ] ListingSerializer 작성
- [ ] ListingViewSet 작성
- [ ] URL 라우팅 설정
- [ ] 지도 범위 필터링 구현
- [ ] 테스트 데이터 생성
- [ ] API 테스트

### Phase 3: Inspection API
- [ ] InspectionSerializer 작성
- [ ] InspectionViewSet 작성
- [ ] AdminInspectionViewSet 작성
- [ ] URL 라우팅 설정
- [ ] 임장 상태 로직 구현
- [ ] API 테스트

### Phase 4: 인증 API
- [ ] JWT 설정
- [ ] AuthViewSet 작성
- [ ] ProfileViewSet 작성
- [ ] 권한 관리 구현
- [ ] API 테스트

### Phase 5: Notice API
- [ ] NoticeSerializer 작성
- [ ] NoticeViewSet 작성
- [ ] Admin 패널 등록
- [ ] API 테스트

### Phase 6: 통합 테스트
- [ ] 프론트엔드 연동 테스트
- [ ] 에러 핸들링 확인
- [ ] 성능 최적화
- [ ] 문서화 업데이트

---

## 🚀 배포 가이드

### 개발 환경 실행

```bash
# 1. 가상환경 활성화
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 데이터베이스 마이그레이션
python manage.py migrate

# 3. 슈퍼유저 생성
python manage.py createsuperuser

# 4. 개발 서버 실행
python manage.py runserver 0.0.0.0:8000

# 5. Celery 실행 (별도 터미널)
celery -A config worker -l info

# 6. Redis/Dragonfly 실행 (별도 터미널)
# Windows: start_dragonfly.bat
```

### 프로덕션 환경

```bash
# 1. 환경 변수 설정
export DEBUG=False
export SECRET_KEY="your-secret-key"
export DATABASE_HOST="your-db-host"
export ALLOWED_HOSTS="yourdomain.com"

# 2. 정적 파일 수집
python manage.py collectstatic --no-input

# 3. Gunicorn으로 실행
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

---

## 📚 참고 자료

### Django REST Framework
- 공식 문서: https://www.django-rest-framework.org/
- Serializers: https://www.django-rest-framework.org/api-guide/serializers/
- ViewSets: https://www.django-rest-framework.org/api-guide/viewsets/

### GeoDjango
- 공식 문서: https://docs.djangoproject.com/en/5.2/ref/contrib/gis/
- PostGIS: https://postgis.net/documentation/

### Celery
- 공식 문서: https://docs.celeryq.dev/

---

## 📞 문의 및 지원

백엔드 개발 관련 문의사항은 개발 팀에 문의해주세요.

**문서 작성일**: 2025-10-17  
**문서 버전**: 1.0.0  
**작성자**: AI Assistant



