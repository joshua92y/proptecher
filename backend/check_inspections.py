#!/usr/bin/env python
"""
임장 데이터 확인 스크립트
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inspections.models import InspectionRequest, ActiveInspection

print("🔍 임장 데이터 확인")
print("=" * 50)
print(f"✅ 임장 요청: {InspectionRequest.objects.count()}개")
print(f"✅ 진행중인 임장: {ActiveInspection.objects.count()}개")
print()
print("📊 요청 상태별 분포:")
for status, label in InspectionRequest.STATUS_CHOICES:
    count = InspectionRequest.objects.filter(상태=status).count()
    if count > 0:
        print(f"   - {label}: {count}개")

print()
print("💼 진행중인 임장 상세:")
for active in ActiveInspection.objects.select_related('요청ID', '평가사ID')[:5]:
    print(f"   - {active.요청ID.매물제목[:30]}... ({active.진행률}%)")

