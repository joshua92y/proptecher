#!/usr/bin/env python
"""
regions 앱의 마이그레이션을 locations로 이전
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from datetime import datetime

cursor = connection.cursor()

print("🔄 regions 앱 마이그레이션 정리 중...")

# 1. regions 앱의 마이그레이션 기록 삭제
cursor.execute("DELETE FROM django_migrations WHERE app = 'regions'")
deleted_count = cursor.rowcount
print(f"✅ regions 마이그레이션 기록 {deleted_count}개 삭제")

# 2. locations 앱에 Region 모델 추가 기록
cursor.execute("""
    INSERT INTO django_migrations (app, name, applied)
    VALUES ('locations', '0004_region', %s)
    ON CONFLICT DO NOTHING
""", [datetime.now()])

print("✅ locations/0004_region 마이그레이션 기록 추가")

# 3. 확인
cursor.execute("""
    SELECT app, name, applied 
    FROM django_migrations 
    WHERE app IN ('regions', 'locations') 
    ORDER BY app, name
""")

print("\n📋 마이그레이션 상태:")
for row in cursor.fetchall():
    print(f"   - {row[0]}/{row[1]} ({row[2]})")

print("\n✅ 마이그레이션 정리 완료!")

