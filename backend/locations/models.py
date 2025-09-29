# backend/locations/models.py
from django.contrib.gis.db import models  # GeoDjango GIS 모델 사용

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
