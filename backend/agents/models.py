from django.db import models
from django.conf import settings


class Agent(models.Model):
    """
    중개사 모델
    """
    사용자ID = models.OneToOneField(
        'users.UserProfile',
        on_delete=models.CASCADE,
        related_name='agent_profile',
        verbose_name='연결된 사용자 프로필'
    )
    중개사무소명 = models.CharField(
        max_length=100,
        verbose_name='중개사무소 상호명'
    )
    중개사등록번호 = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='공인중개사 등록번호'
    )
    대표자명 = models.CharField(
        max_length=50,
        verbose_name='대표자 성명'
    )
    사무소주소 = models.TextField(
        verbose_name='중개사무소 소재지'
    )
    사무소전화번호 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='사무소 대표 전화번호'
    )
    영업시간 = models.TextField(
        null=True,
        blank=True,
        verbose_name='영업 시간 정보'
    )
    서비스지역 = models.TextField(
        null=True,
        blank=True,
        verbose_name='서비스 제공 지역'
    )
    소개글 = models.TextField(
        null=True,
        blank=True,
        verbose_name='중개사 소개'
    )
    인증여부 = models.BooleanField(
        default=False,
        verbose_name='중개사 인증 완료 여부'
    )
    인증일시 = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='인증 완료 일시'
    )
    평점 = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        verbose_name='중개사 평균 평점'
    )
    리뷰수 = models.IntegerField(
        default=0,
        verbose_name='받은 리뷰 개수'
    )
    완료임장수 = models.IntegerField(
        default=0,
        verbose_name='완료한 임장 수'
    )
    활성화여부 = models.BooleanField(
        default=True,
        verbose_name='활동 여부'
    )
    생성일시 = models.DateTimeField(
        auto_now_add=True,
        verbose_name='등록 일시'
    )

    class Meta:
        verbose_name = '중개사'
        verbose_name_plural = '중개사'
        db_table = 'agents'

    def __str__(self):
        return f"{self.중개사무소명} ({self.대표자명})"
