from django.db import migrations
import django.contrib.gis.db.models.fields
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0004_region'),
    ]

    operations = [
        migrations.CreateModel(
            name='SubwayStation',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('역코드', models.CharField(blank=True, max_length=30, null=True, unique=True, verbose_name='역 코드')),
                ('역명', models.CharField(max_length=100, verbose_name='역 이름')),
                ('노선명', models.CharField(blank=True, max_length=100, null=True, verbose_name='노선명(콤마구분)')),
                ('위치', django.contrib.gis.db.models.fields.PointField(blank=True, null=True, srid=4326, verbose_name='역 위치')),
                ('시도', models.CharField(blank=True, max_length=50, null=True, verbose_name='시도')),
                ('시군구', models.CharField(blank=True, max_length=50, null=True, verbose_name='시군구')),
            ],
            options={
                'verbose_name': '지하철역',
                'verbose_name_plural': '지하철역',
                'db_table': 'subway_stations',
            },
        ),
        migrations.AddIndex(
            model_name='subwaystation',
            index=models.Index(fields=['역명'], name='locations_s_역명_idx'),
        ),
        migrations.AddIndex(
            model_name='subwaystation',
            index=models.Index(fields=['노선명'], name='locations_s_노선명_idx'),
        ),
    ]


