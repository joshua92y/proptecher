from django.contrib import admin
from .models import Region

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['시도', '시군구', '읍면동', '활성화여부']
    list_filter = ['시도', '활성화여부']
    search_fields = ['시도', '시군구', '읍면동']
