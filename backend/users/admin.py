from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', '사용자유형', '연락처', '활성화여부']
    list_filter = ['사용자유형', '활성화여부']
    search_fields = ['user__username', 'user__email']
