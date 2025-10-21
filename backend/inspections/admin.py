from django.contrib import admin
from .models import InspectionRequest, ActiveInspection, InspectionCancellation


@admin.register(InspectionRequest)
class InspectionRequestAdmin(admin.ModelAdmin):
    """
    임장 요청 관리자 페이지
    """
    list_display = [
        'id', '매물제목', '요청자ID', '담당평가사ID', '상태',
        '희망날짜', '임장비', '요청일시'
    ]
    list_filter = ['상태', '희망날짜', '요청일시']
    search_fields = ['매물제목', '매물주소', '요청자ID__user__username']
    readonly_fields = ['요청일시', '수락일시', '완료일시']
    ordering = ['-요청일시']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('매물ID', '요청자ID', '담당평가사ID', '상태')
        }),
        ('요청 정보', {
            'fields': ('희망날짜', '연락처', '요청사항', '임장비')
        }),
        ('매물 스냅샷', {
            'fields': ('매물제목', '매물주소', '가격정보', '매물이미지URL'),
            'classes': ('collapse',)
        }),
        ('매물 상세', {
            'fields': ('매물설명', '특이사항', '현재사진URLs'),
            'classes': ('collapse',)
        }),
        ('타임스탬프', {
            'fields': ('요청일시', '수락일시', '완료일시'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            '매물ID', '요청자ID', '담당평가사ID'
        )


@admin.register(ActiveInspection)
class ActiveInspectionAdmin(admin.ModelAdmin):
    """
    진행중인 임장 관리자 페이지
    """
    list_display = [
        'id', 'get_매물제목', '평가사ID', '진행률',
        '시작일시', '수정일시'
    ]
    list_filter = ['진행률', '시작일시']
    search_fields = ['요청ID__매물제목', '평가사ID__이름']
    readonly_fields = ['시작일시', '수정일시']
    ordering = ['-시작일시']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('요청ID', '평가사ID', '진행률')
        }),
        ('파일 및 메모', {
            'fields': ('평면도URL', '리포트URL', '평가사메모')
        }),
        ('타임스탬프', {
            'fields': ('시작일시', '수정일시'),
            'classes': ('collapse',)
        }),
    )
    
    def get_매물제목(self, obj):
        return obj.요청ID.매물제목
    get_매물제목.short_description = '매물 제목'
    get_매물제목.admin_order_field = '요청ID__매물제목'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            '요청ID', '평가사ID'
        )


@admin.register(InspectionCancellation)
class InspectionCancellationAdmin(admin.ModelAdmin):
    """
    임장 취소 기록 관리자 페이지
    """
    list_display = [
        'id', 'get_매물제목', '평가사ID', '재요청여부', '취소일시'
    ]
    list_filter = ['재요청여부', '취소일시']
    search_fields = ['임장ID__요청ID__매물제목', '평가사ID__이름', '취소사유']
    readonly_fields = ['취소일시']
    ordering = ['-취소일시']
    list_per_page = 20
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('임장ID', '평가사ID', '재요청여부')
        }),
        ('취소 상세', {
            'fields': ('취소사유',)
        }),
        ('타임스탬프', {
            'fields': ('취소일시',),
            'classes': ('collapse',)
        }),
    )
    
    def get_매물제목(self, obj):
        return obj.임장ID.요청ID.매물제목 if obj.임장ID and obj.임장ID.요청ID else '-'
    get_매물제목.short_description = '매물 제목'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            '임장ID__요청ID', '평가사ID'
        )

