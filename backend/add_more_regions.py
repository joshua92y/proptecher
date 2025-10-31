#!/usr/bin/env python
"""
인천, 광주, 대구, 울산, 경기도에 각 2개씩 총 10개의 추가 매물 생성
"""
import os
import sys
import django
from datetime import date
import random

# Django 설정 로드
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from properties.models import Property
from locations.models import Region
from users.models import UserProfile
from agents.models import Agent

def add_more_regions():
    """새로운 지역에 매물 추가"""

    print('=== 추가 지역 매물 생성 시작 ===')

    # 기존 데이터 조회
    user_profile = UserProfile.objects.filter(사용자유형='user').first()
    agent = Agent.objects.filter(중개사무소명='테스트 중개사무소').first()

    if not user_profile or not agent:
        print('기존 데이터가 없습니다.')
        return

    # 새로운 지역 추가
    new_regions_data = [
        ('인천광역시', '남동구', '구월동'),
        ('광주광역시', '북구', '운암동'),
        ('대구광역시', '중구', '동성로2가'),
        ('울산광역시', '남구', '삼산동'),
        ('경기도', '성남시 분당구', '정자동'),
    ]

    # 지역 생성 또는 조회
    new_regions = {}
    for sido, sigungu, eupmyeondong in new_regions_data:
        region, created = Region.objects.get_or_create(
            시도=sido,
            시군구=sigungu,
            읍면동=eupmyeondong,
            defaults={
                '활성화여부': True,
            }
        )
        new_regions[sido] = region
        if created:
            print(f'✓ 새 지역 생성: {sido} {sigungu} {eupmyeondong}')

    # 각 지역별 추가 매물 (2개씩)
    additional_properties = [
        # 인천
        {'지역': '인천광역시', '타입': 'jeonse', '주택종류': 'apartment', 'jeonse_price': 220000000, '면적': 85.0, '평수': 25.7, '위도': 37.4500, '경도': 126.7300, '주소': '인천광역시 남동구 구월동 123-45'},
        {'지역': '인천광역시', '타입': 'monthly', '주택종류': 'officetel', 'monthly_deposit': 30000000, 'monthly_rent': 500000, '면적': 55.0, '평수': 16.6, '위도': 37.4550, '경도': 126.7350, '주소': '인천광역시 남동구 구월동 678-90'},

        # 광주
        {'지역': '광주광역시', '타입': 'jeonse', '주택종류': 'apartment', 'jeonse_price': 180000000, '면적': 78.0, '평수': 23.6, '위도': 35.1700, '경도': 126.9100, '주소': '광주광역시 북구 운암동 456-78'},
        {'지역': '광주광역시', '타입': 'sale', '주택종류': 'villa', 'sale_price': 160000000, '면적': 95.0, '평수': 28.7, '위도': 35.1750, '경도': 126.9150, '주소': '광주광역시 북구 운암동 901-23'},

        # 대구
        {'지역': '대구광역시', '타입': 'monthly', '주택종류': 'officetel', 'monthly_deposit': 25000000, 'monthly_rent': 450000, '면적': 50.0, '평수': 15.1, '위도': 35.8700, '경도': 128.6000, '주소': '대구광역시 중구 동성로2가 789-12'},
        {'지역': '대구광역시', '타입': 'jeonse', '주택종류': 'apartment', 'jeonse_price': 200000000, '면적': 80.0, '평수': 24.2, '위도': 35.8750, '경도': 128.6050, '주소': '대구광역시 중구 동성로2가 345-67'},

        # 울산
        {'지역': '울산광역시', '타입': 'jeonse', '주택종류': 'apartment', 'jeonse_price': 190000000, '면적': 75.0, '평수': 22.7, '위도': 35.5400, '경도': 129.3200, '주소': '울산광역시 남구 삼산동 111-22'},
        {'지역': '울산광역시', '타입': 'sale', '주택종류': 'villa', 'sale_price': 170000000, '면적': 90.0, '평수': 27.2, '위도': 35.5450, '경도': 129.3250, '주소': '울산광역시 남구 삼산동 333-44'},

        # 경기도
        {'지역': '경기도', '타입': 'monthly', '주택종류': 'officetel', 'monthly_deposit': 35000000, 'monthly_rent': 600000, '면적': 60.0, '평수': 18.1, '위도': 37.3500, '경도': 127.1100, '주소': '경기도 성남시 분당구 정자동 555-66'},
        {'지역': '경기도', '타입': 'jeonse', '주택종류': 'apartment', 'jeonse_price': 280000000, '면적': 90.0, '평수': 27.2, '위도': 37.3550, '경도': 127.1150, '주소': '경기도 성남시 분당구 정자동 777-88'},
    ]

    created_count = 0
    for prop_data in additional_properties:
        region = new_regions[prop_data['지역']]

        # 이미지 경로 설정 (주택 종류에 따라)
        image_mapping = {
            'apartment': '/images/apt1.jpg',
            'officetel': '/images/apt2.jpg',
            'villa': '/images/house1.jpg',
            'oneroom': '/images/room1.jpg',
            'tworoom': '/images/room2.jpg'
        }
        image_url = image_mapping.get(prop_data['주택종류'], '/images/apt1.jpg')

        common_data = {
            '등록사용자ID': user_profile,
            '관리중개사ID': agent,
            '지역ID': region,
            '매물타입': prop_data['타입'],
            '주택종류': prop_data['주택종류'],
            '주소': prop_data['주소'],
            '도로명주소': f"{prop_data['주소']} 도로명",
            '상세주소': f"{random.randint(100, 999)}호",
            '위도': prop_data['위도'],
            '경도': prop_data['경도'],
            '월관리비': random.randint(80000, 150000),
            '주차정보': '주차 가능',
            '전용면적_제곱미터': prop_data['면적'],
            '전용면적_평': prop_data['평수'],
            '방수': random.randint(1, 4),
            '욕실수': random.randint(1, 2),
            '층수': f"{random.randint(1, 15)}/{random.randint(15, 25)}",
            '현재층': random.randint(1, 15),
            '총층수': random.randint(15, 25),
            '준공년도': random.randint(2010, 2023),
            '공급면적_제곱미터': round(prop_data['면적'] * 1.2, 2),
            '방향': random.choice(['남', '북', '동', '서']),
            '총세대수': random.randint(50, 200),
            '총주차대수': random.randint(50, 150),
            '현관유형': random.choice(['계단식', '복도식']),
            '입주가능일': '즉시',
            '건축물용도': '공동주택(아파트)',
            '사용승인일': date(random.randint(2010, 2023), 1, 1),
            '최초등록일': date(2024, 10, random.randint(1, 30)),
            '계약기간_개월': 24 if prop_data['타입'] == 'jeonse' else 12,
            '재계약가능여부': True,
            '대중교통점수': random.randint(5, 9),
            '노선다양성점수': random.randint(2, 4),
            '버스정류장정보': [{'stop_name': '버스정류장', 'distance_m': 200, 'bus_numbers': ['123']}],
            '지하철역정보': [{'station_name': '지하철역', 'line_names': ['1호선'], 'distance_m': 300}],
            '편의시설요약': '편의시설이 잘 갖춰진 지역',
            '이미지URLs': [image_url],
            'QA정보': [],
            '매물상태': 'available',
            '상세설명': f'{prop_data["지역"]} 매물입니다.',
            '활성화여부': True
        }

        # 가격 설정
        if prop_data['타입'] == 'jeonse':
            common_data['전세보증금'] = prop_data.get('jeonse_price')
        elif prop_data['타입'] == 'monthly':
            common_data['월세보증금'] = prop_data.get('monthly_deposit')
            common_data['월세'] = prop_data.get('monthly_rent')
        else:  # sale
            common_data['매매가'] = prop_data.get('sale_price')

        property_obj, created = Property.objects.get_or_create(
            주소=prop_data['주소'],
            defaults=common_data
        )
        if created:
            created_count += 1
            print(f'✓ 매물 생성: {prop_data["지역"]} - {prop_data["주소"]}')

    print(f'🎉 총 {created_count}개의 추가 매물 생성 완료!')
    print(f'현재 총 매물 수: {Property.objects.count()}')

    # 지역별 매물 수 확인
    regions = ['서울특별시', '부산광역시', '대전광역시', '인천광역시', '광주광역시', '대구광역시', '울산광역시', '경기도']
    for region in regions:
        count = Property.objects.filter(지역ID__시도=region).count()
        print(f'{region}: {count}개')

if __name__ == '__main__':
    try:
        add_more_regions()
        print("✅ 추가 지역 매물 생성 작업 완료!")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
