from django.contrib import admin
from .models import Sido


@admin.register(Sido)
class SidoAdmin(admin.ModelAdmin):
    """
    시도 관리자 페이지 설정
    """
    list_display = ['ufid', 'name', 'divi', 'scls', 'created_at', 'updated_at']
    list_filter = ['divi', 'scls', 'fmta', 'created_at']
    search_fields = ['ufid', 'name', 'bjcd']
    readonly_fields = ['ufid', 'created_at', 'updated_at']
    ordering = ['name']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('ufid', 'name', 'bjcd')
        }),
        ('분류 정보', {
            'fields': ('divi', 'scls', 'fmta')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
