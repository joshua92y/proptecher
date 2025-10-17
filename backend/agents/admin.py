from django.contrib import admin
from .models import Agent

@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ['중개사무소명', '대표자명', '중개사등록번호', '인증여부', '평점']
    list_filter = ['인증여부', '활성화여부']
    search_fields = ['중개사무소명', '대표자명', '중개사등록번호']
