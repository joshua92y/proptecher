# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspections', '0002_activeinspection_평면도데이터'),
    ]

    operations = [
        migrations.AddField(
            model_name='activeinspection',
            name='보고서확정여부',
            field=models.BooleanField(default=False, verbose_name='보고서 확정 여부'),
        ),
        migrations.AddField(
            model_name='activeinspection',
            name='종합의견',
            field=models.TextField(blank=True, help_text='평가사의 최종 종합 의견', null=True, verbose_name='종합 의견'),
        ),
        migrations.AddField(
            model_name='activeinspection',
            name='추천여부',
            field=models.CharField(blank=True, choices=[('적극추천', '적극 추천'), ('추천', '추천'), ('보류', '보류'), ('비추천', '비추천')], max_length=20, null=True, verbose_name='추천 여부'),
        ),
        migrations.AddField(
            model_name='activeinspection',
            name='체크리스트데이터',
            field=models.JSONField(blank=True, help_text='외부/내부 체크리스트 및 사진 데이터', null=True, verbose_name='체크리스트 데이터'),
        ),
        migrations.AddField(
            model_name='activeinspection',
            name='확정일시',
            field=models.DateTimeField(blank=True, null=True, verbose_name='보고서 확정 일시'),
        ),
    ]

