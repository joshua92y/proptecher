from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.contrib.gis.admin.options import GeoModelAdminMixin
from .models import BusStop, Region, SubwayStation


# Sido 관리자 등록 제거됨


@admin.register(BusStop)
class BusStopAdmin(GISModelAdmin):
    """
    버스정류장 관리자 페이지 설정 - OpenStreetMap 사용
    """
    # OpenStreetMap 설정
    default_lat = 37.5665    # 서울 위도
    default_lon = 126.9780   # 서울 경도
    default_zoom = 10        # 기본 줌 레벨
    max_zoom = 18            # 최대 줌
    
    list_display = ['정류장번호', '정류장명', '도시명', '관리도시명', '정보수집일']
    list_filter = ['도시명', '관리도시명', '정보수집일']
    search_fields = ['정류장번호', '정류장명', '도시명']
    readonly_fields = ['정류장번호', '정보수집일']
    ordering = ['정류장명']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('정류장번호', '정류장명', '위치')
        }),
        ('위치 정보', {
            'fields': ('도시코드', '도시명', '관리도시명', '모바일단축번호')
        }),
        ('시스템 정보', {
            'fields': ('정보수집일',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    """
    지역 관리자 페이지 설정
    """
    list_display = ['id', '시도', '시군구', '읍면동', '활성화여부']
    list_filter = ['시도', '활성화여부']
    search_fields = ['시도', '시군구', '읍면동']
    ordering = ['시도', '시군구', '읍면동']
    list_per_page = 50
    
    fieldsets = (
        ('지역 정보', {
            'fields': ('시도', '시군구', '읍면동')
        }),
        ('설정', {
            'fields': ('활성화여부',)
        }),
    )


@admin.register(SubwayStation)
class SubwayStationAdmin(GISModelAdmin):
    """
    지하철역 관리자 페이지 설정 - OpenStreetMap 사용
    """
    default_lat = 37.5665
    default_lon = 126.9780
    default_zoom = 10
    max_zoom = 18

    list_display = ['id', '역코드', '역명', '노선명', '주소', '시도', '시군구']
    list_filter = ['시도', '시군구', '노선명']
    search_fields = ['역코드', '역명', '노선명', '주소']
    ordering = ['역명']
    list_per_page = 20

    fieldsets = (
        ('기본 정보', {
            'fields': ('역코드', '역명', '노선명', '주소', '위치')
        }),
        ('행정구역', {
            'fields': ('시도', '시군구')
        }),
    )
