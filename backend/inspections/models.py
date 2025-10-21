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

