from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0005_subwaystation'),
    ]

    operations = [
        migrations.AddField(
            model_name='subwaystation',
            name='주소',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='주소'),
        ),
    ]


