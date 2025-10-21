# backend/locations/models.py
from django.contrib.gis.db import models  # GeoDjango GIS 모델 사용
from django.contrib.gis.geos import Point

class Sido(models.Model):
    id = models.AutoField(primary_key=True)  # 실제 PK
    geom = models.MultiPolygonField(srid=5179, null=True, blank=True)
    ufid = models.CharField(max_length=34, null=True, blank=True, db_column="UFID")
    bjcd = models.CharField(max_length=10, null=True, blank=True, db_column="BJCD",verbose_name='법정동코드')
    name = models.CharField(max_length=100, null=True, blank=True, db_column="NAME",verbose_name='명칭')
    divi = models.CharField(max_length=6, null=True, blank=True, db_column="DIVI",verbose_name='구분')
    scls = models.CharField(max_length=8, null=True, blank=True, db_column="SCLS",verbose_name='통합코드')
    fmta = models.CharField(max_length=9, null=True, blank=True, db_column="FMTA",verbose_name='제작정보')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')

    class Meta:
        db_table = 'locations_korea"."sido_5179'  # 스키마 + 테이블 지정
        managed = False  # Django가 마이그레이션으로 건드리지 않음
        verbose_name = "시도"
        verbose_name_plural = "시도"
        app_label = "locations"
        ordering = ["name"]

    def __str__(self):
        return self.name or str(self.id)


class BusStop(models.Model):
    """
    전국 버스정류장 모델
    """
    정류장번호 = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name='정류장 번호'
    )
    정류장명 = models.CharField(
        max_length=100,
        verbose_name='정류장 이름'
    )
    위치 = models.PointField(
        srid=4326,  # WGS84 좌표계
        null=True,
        blank=True,
        verbose_name='정류장 위치'
    )
    정보수집일 = models.DateField(
        null=True,
        blank=True,
        verbose_name='정보 수집 일'
    )
    모바일단축번호 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='모바일 단축번호'
    )
    도시코드 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='도시 코드'
    )
    도시명 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='도시 이름'
    )
    관리도시명 = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='관리 도시 이름'
    )

    # GeoDjango 설정 (최신 Django에서는 기본 Manager 사용)
    # objects = models.GeoManager()  # 더 이상 사용되지 않음

    class Meta:
        verbose_name = '버스정류장'
        verbose_name_plural = '버스정류장'
        db_table = 'bus_stops'
        ordering = ['정류장번호']

    def __str__(self):
        return f"{self.정류장명} ({self.정류장번호})"

    @property
    def 위도(self):
        """위도 반환"""
        return self.위치.y if self.위치 else None

    @property
    def 경도(self):
        """경도 반환"""
        return self.위치.x if self.위치 else None


class Region(models.Model):
    """
    지역 모델 (시도/시군구/읍면동)
    locations 앱으로 통합 (기존 regions 앱 제거)
    """
    시도 = models.CharField(
        max_length=20,
        verbose_name='시도'
    )
    시군구 = models.CharField(
        max_length=50,
        verbose_name='시군구'
    )
    읍면동 = models.CharField(
        max_length=50,
        verbose_name='읍면동'
    )
    활성화여부 = models.BooleanField(
        default=True,
        verbose_name='활성화 여부'
    )

    class Meta:
        verbose_name = '지역'
        verbose_name_plural = '지역'
        db_table = 'regions'
        unique_together = ['시도', '시군구', '읍면동']
        ordering = ['시도', '시군구', '읍면동']

    def __str__(self):
        return f"{self.시도} {self.시군구} {self.읍면동}"

