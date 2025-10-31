#!/usr/bin/env python
"""
각 지역별로 3개씩 추가 매물 데이터 생성
총 9개 매물 추가 (서울 3, 부산 3, 대전 3)
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
from users.models import UserProfile
from agents.models import Agent
from locations.models import Region
from properties.models import Property

def create_additional_properties():
    """각 지역별로 3개씩 추가 매물 생성"""

    print('=== 추가 매물 데이터 생성 시작 ===')

    # 기존 데이터 조회 (실제 존재하는 데이터 사용)
    try:
        # 실제 존재하는 데이터 사용
        user_profile = UserProfile.objects.filter(사용자유형='user').first()
        agent = Agent.objects.filter(중개사무소명='테스트 중개사무소').first()

        if not user_profile:
            print('사용자 프로필이 없습니다.')
            return
        if not agent:
            print('중개사가 없습니다.')
            return

        print(f'사용자: {user_profile.user.username}')
        print(f'중개사: {agent.중개사무소명}')
        print('기존 데이터 조회 완료')
    except Exception as e:
        print(f'기존 데이터 조회 실패: {e}')
        return

    # 지역 데이터 조회
    regions = {}
    region_mapping = {
        '서울특별시': ('서울특별시', '강남구', '역삼동'),
        '부산광역시': ('부산광역시', '해운대구', '센텀동'),
        '대전광역시': ('대전광역시', '유성구', '봉명동')
    }

    for region_name, (sido, sigungu, eupmyeondong) in region_mapping.items():
        try:
            regions[region_name] = Region.objects.get(시도=sido, 시군구=sigungu, 읍면동=eupmyeondong)
            print(f'✓ 지역 조회: {region_name}')
        except Exception as e:
            print(f'지역 조회 실패: {region_name} - {e}')
            return

    # 각 지역별 추가 매물 데이터
    additional_properties = [
        # 서울 추가 매물
        {
            '지역': '서울특별시',
            '타입': 'jeonse',
            '주택종류': 'apartment',
            'jeonse_price': 250000000,  # 2.5억
            '면적': 75.32,
            '평수': 22.78,
            '위도': 37.4980,
            '경도': 127.0350,
            '주소': '서울특별시 강남구 역삼동 456-78',
            '도로명주소': '서울특별시 강남구 테헤란로 456',
            '상세주소': '101호'
        },
        {
            '지역': '서울특별시',
            '타입': 'monthly',
            '주택종류': 'officetel',
            'monthly_deposit': 30000000,  # 3천만 보증금
            'monthly_rent': 600000,   # 60만 월세
            '면적': 45.67,
            '평수': 13.81,
            '위도': 37.5020,
            '경도': 127.0380,
            '주소': '서울특별시 강남구 역삼동 789-12',
            '도로명주소': '서울특별시 강남구 역삼로 789',
            '상세주소': '202호'
        },
        {
            '지역': '서울특별시',
            '타입': 'sale',
            '주택종류': 'villa',
            'sale_price': 180000000,  # 1.8억
            '면적': 95.45,
            '평수': 28.87,
            '위도': 37.4960,
            '경도': 127.0320,
            '주소': '서울특별시 강남구 역삼동 321-45',
            '도로명주소': '서울특별시 강남구 봉은사로 321',
            '상세주소': '단독주택'
        },

        # 부산 추가 매물
        {
            '지역': '부산광역시',
            '타입': 'jeonse',
            '주택종류': 'apartment',
            'jeonse_price': 180000000,  # 1.8억
            '면적': 78.92,
            '평수': 23.86,
            '위도': 35.1720,
            '경도': 129.1320,
            '주소': '부산광역시 해운대구 센텀동 456-12',
            '도로명주소': '부산광역시 해운대구 센텀북대로 456',
            '상세주소': '303호'
        },
        {
            '지역': '부산광역시',
            '타입': 'monthly',
            '주택종류': 'officetel',
            'monthly_deposit': 40000000,  # 4천만 보증금
            'monthly_rent': 700000,   # 70만 월세
            '면적': 52.34,
            '평수': 15.83,
            '위도': 35.1680,
            '경도': 129.1360,
            '주소': '부산광역시 해운대구 센텀동 789-34',
            '도로명주소': '부산광역시 해운대구 센텀중앙로 789',
            '상세주소': '405호'
        },
        {
            '지역': '부산광역시',
            '타입': 'sale',
            '주택종류': 'villa',
            'sale_price': 220000000,  # 2.2억
            '면적': 110.67,
            '평수': 33.45,
            '위도': 35.1740,
            '경도': 129.1280,
            '주소': '부산광역시 해운대구 센텀동 123-56',
            '도로명주소': '부산광역시 해운대구 센텀서로 123',
            '상세주소': '단독주택'
        },

        # 대전 추가 매물
        {
            '지역': '대전광역시',
            '타입': 'jeonse',
            '주택종류': 'apartment',
            'jeonse_price': 150000000,  # 1.5억
            '면적': 72.45,
            '평수': 21.92,
            '위도': 36.3520,
            '경도': 127.3920,
            '주소': '대전광역시 유성구 봉명동 456-78',
            '도로명주소': '대전광역시 유성구 유성대로 456',
            '상세주소': '505호'
        },
        {
            '지역': '대전광역시',
            '타입': 'monthly',
            '주택종류': 'officetel',
            'monthly_deposit': 25000000,  # 2.5천만 보증금
            'monthly_rent': 500000,   # 50만 월세
            '면적': 48.92,
            '평수': 14.80,
            '위도': 36.3480,
            '경도': 127.3960,
            '주소': '대전광역시 유성구 봉명동 789-01',
            '도로명주소': '대전광역시 유성구 온천북로 789',
            '상세주소': '301호'
        },
        {
            '지역': '대전광역시',
            '타입': 'sale',
            '주택종류': 'villa',
            'sale_price': 190000000,  # 1.9억
            '면적': 105.23,
            '평수': 31.83,
            '위도': 36.3560,
            '경도': 127.3880,
            '주소': '대전광역시 유성구 봉명동 234-56',
            '도로명주소': '대전광역시 유성구 학하서로 234',
            '상세주소': '단독주택'
        }
    ]

    created_count = 0
    for prop_data in additional_properties:
        region = regions[prop_data['지역']]

        # 기본 공통 데이터
        common_data = {
            '등록사용자ID': user_profile,
            '관리중개사ID': agent,
            '지역ID': region,
            '매물타입': prop_data['타입'],
            '주택종류': prop_data['주택종류'],
            '주소': prop_data['주소'],
            '도로명주소': prop_data.get('도로명주소', prop_data['주소']),
            '상세주소': prop_data.get('상세주소', '101호'),
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
            '방향': random.choice(['남', '북', '동', '서', '남동', '남서']),
            '총세대수': random.randint(50, 200),
            '총주차대수': random.randint(50, 150),
            '현관유형': random.choice(['계단식', '복도식']),
            '입주가능일': '즉시',
            '건축물용도': '공동주택(아파트)' if prop_data['주택종류'] == 'apartment' else ('업무시설' if prop_data['주택종류'] == 'officetel' else '단독주택'),
            '사용승인일': date(random.randint(2010, 2023), 1, 1),
            '최초등록일': date(2024, 10, random.randint(1, 30)),
            '계약기간_개월': 24 if prop_data['타입'] == 'jeonse' else (12 if prop_data['타입'] == 'monthly' else None),
            '재계약가능여부': prop_data['타입'] != 'sale',
            '대중교통점수': random.randint(5, 9),
            '노선다양성점수': random.randint(2, 4),
            '버스정류장정보': [
                {'stop_name': f'{prop_data["지역"][:2]}역', 'distance_m': random.randint(100, 500), 'bus_numbers': [f'{random.randint(100, 999)}']}
            ],
            '지하철역정보': [
                {'station_name': f'{prop_data["지역"][:2]}역', 'line_names': [f'{random.randint(1,9)}호선'], 'distance_m': random.randint(200, 800)}
            ],
            '편의시설요약': f'{prop_data["지역"][:2]}역 인근 편의시설 밀집 지역',
            '이미지URLs': [f'/images/{prop_data["주택종류"]}1.jpg'],
            'QA정보': [],
            '매물상태': 'available',
            '상세설명': f'{prop_data["지역"]}에 위치한 깔끔한 {prop_data["주택종류"]}입니다.',
            '활성화여부': True
        }

        # 타입별 가격 설정
        if prop_data['타입'] == 'jeonse':
            common_data.update({
                '전세보증금': prop_data.get('jeonse_price'),
                '매매가': None,
                '월세보증금': None,
                '월세': None
            })
        elif prop_data['타입'] == 'monthly':
            common_data.update({
                '전세보증금': None,
                '매매가': None,
                '월세보증금': prop_data.get('monthly_deposit'),
                '월세': prop_data.get('monthly_rent')
            })
        else:  # sale
            common_data.update({
                '전세보증금': None,
                '매매가': prop_data.get('sale_price'),
                '월세보증금': None,
                '월세': None
            })

        property_obj, created = Property.objects.get_or_create(
            주소=prop_data['주소'],
            defaults=common_data
        )
        if created:
            created_count += 1
            print(f'✓ 매물 생성: {prop_data["타입"]} - {prop_data["주소"]}')

    print(f'🎉 총 {created_count}개의 추가 매물 생성 완료!')
    print(f'현재 총 매물 수: {Property.objects.count()}')
    return created_count

if __name__ == '__main__':
    try:
        create_additional_properties()
        print("✅ 추가 매물 데이터 생성 작업 완료!")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
