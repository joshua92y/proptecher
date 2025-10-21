#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
전국 버스정류장 데이터를 GeoDjango 데이터베이스에 import하는 스크립트
"""
import os
import csv
import django
from datetime import datetime

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.gis.geos import Point
from locations.models import BusStop

def import_bus_stops():
    """
    CSV 파일에서 버스정류장 데이터를 읽어서 데이터베이스에 저장
    """
    csv_file_path = 'TOTAL_sp_bus_stop_locations.csv'

    print("버스정류장 데이터 import 시작...")

    # 기존 데이터 삭제 (선택사항)
    # BusStop.objects.all().delete()
    # print("기존 버스정류장 데이터 삭제 완료")

    imported_count = 0
    error_count = 0

    with open(csv_file_path, 'r', encoding='cp949') as csvfile:
        reader = csv.DictReader(csvfile)

        for row_num, row in enumerate(reader, 1):
            try:
                # 데이터 추출
                정류장번호 = row['정류장번호'].strip()
                정류장명 = row['정류장명'].strip()
                위도 = float(row['위도'])
                경도 = float(row['경도'])

                # 날짜 변환 (YYYY-MM-DD 형식)
                정보수집일_str = row.get('정보수집일', '').strip()
                정보수집일 = None
                if 정보수집일_str:
                    try:
                        정보수집일 = datetime.strptime(정보수집일_str, '%Y-%m-%d').date()
                    except ValueError:
                        print(f"날짜 변환 오류 (행 {row_num}): {정보수집일_str}")

                모바일단축번호 = row.get('모바일단축번호', '').strip() or None
                도시코드 = row.get('도시코드', '').strip() or None
                도시명 = row.get('도시명', '').strip() or None
                관리도시명 = row.get('관리도시명', '').strip() or None

                # 지리적 포인트 생성 (경도, 위도 순서)
                point = Point(경도, 위도, srid=4326)

                # 버스정류장 객체 생성 또는 업데이트
                bus_stop, created = BusStop.objects.update_or_create(
                    정류장번호=정류장번호,
                    defaults={
                        '정류장명': 정류장명,
                        '위치': point,
                        '정보수집일': 정보수집일,
                        '모바일단축번호': 모바일단축번호,
                        '도시코드': 도시코드,
                        '도시명': 도시명,
                        '관리도시명': 관리도시명,
                    }
                )

                if created:
                    imported_count += 1

                # 진행상황 표시 (1000개마다)
                if row_num % 1000 == 0:
                    print(f"{row_num}개 행 처리 중... (생성: {imported_count}, 오류: {error_count})")

            except Exception as e:
                error_count += 1
                print(f"오류 발생 (행 {row_num}): {str(e)} - 데이터: {row}")

    print("
=== Import 완료 ===")
    print(f"총 처리 행수: {row_num}")
    print(f"새로 생성된 버스정류장: {imported_count}")
    print(f"업데이트된 버스정류장: {row_num - imported_count}")
    print(f"오류 발생 건수: {error_count}")

def check_database_connection():
    """
    데이터베이스 연결 확인
    """
    try:
        # 단순 쿼리로 연결 테스트
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("데이터베이스 연결 성공")
        return True
    except Exception as e:
        print(f"데이터베이스 연결 실패: {str(e)}")
        return False

if __name__ == '__main__':
    # 데이터베이스 연결 확인
    if not check_database_connection():
        print("데이터베이스 연결을 확인해주세요.")
        exit(1)

    # import 실행
    import_bus_stops()
