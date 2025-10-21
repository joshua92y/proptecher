#!/usr/bin/env python
"""
regions 테이블 존재 확인
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("""
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_name = 'regions'
""")

exists = cursor.fetchone()[0] > 0
print(f"regions 테이블 존재: {exists}")

if exists:
    cursor.execute("SELECT COUNT(*) FROM regions")
    count = cursor.fetchone()[0]
    print(f"regions 테이블 레코드 수: {count}개")

