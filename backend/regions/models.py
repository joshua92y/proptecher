from django.db import models


class Region(models.Model):
    """
    지역 모델 (시도/시군구/읍면동)
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

    def __str__(self):
        return f"{self.시도} {self.시군구} {self.읍면동}"
