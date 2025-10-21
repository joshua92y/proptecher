from django.db import models
from django.conf import settings


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
