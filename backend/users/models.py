from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """
    사용자 프로필 모델 (기본 User 모델과 연결)
    """
    USER_TYPE_CHOICES = [
        ('user', '일반회원'),
        ('agent', '중개사'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='연결된 사용자'
    )
    사용자유형 = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='user',
        verbose_name='사용자 유형'
    )
    연락처 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='휴대폰 번호'
    )
    프로필이미지URL = models.TextField(
        null=True,
        blank=True,
        verbose_name='프로필 이미지 URL'
    )
    활성화여부 = models.BooleanField(
        default=True,
        verbose_name='활성화 여부'
    )

    class Meta:
        verbose_name = '사용자 프로필'
        verbose_name_plural = '사용자 프로필'
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.get_사용자유형_display()} - {self.user.username}"
