# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspections', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='activeinspection',
            name='평면도데이터',
            field=models.JSONField(blank=True, help_text='벽, 방, 오브젝트 등 편집 가능한 평면도 데이터', null=True, verbose_name='평면도 편집 데이터'),
        ),
    ]

