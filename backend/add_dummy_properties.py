#!/usr/bin/env python
"""
더미 매물 데이터 추가 스크립트
서울, 부산, 대전에 매물 하나씩 추가
"""
import os
import sys
import django
from datetime import date

# Django 설정 로드
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile
from agents.models import Agent
from locations.models import Region
from properties.models import Property

def create_dummy_data():
    """더미 데이터 생성"""

    # 1. 사용자 및 프로필 생성
    print("사용자 및 프로필 생성 중...")

    # 일반 사용자
    user, created = User.objects.get_or_create(
        username='dummy_user',
        defaults={'email': 'dummy@example.com'}
    )
    if created:
        user.set_password('password123')
        user.save()

    user_profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            '사용자유형': 'user',
            '연락처': '010-1234-5678'
        }
    )

    # 중개사 사용자
    agent_user, created = User.objects.get_or_create(
        username='dummy_agent',
        defaults={'email': 'agent@example.com'}
    )
    if created:
        agent_user.set_password('password123')
        agent_user.save()

    agent_profile, created = UserProfile.objects.get_or_create(
        user=agent_user,
        defaults={
            '사용자유형': 'agent',
            '연락처': '010-9876-5432'
        }
    )

    # 중개사 생성
    agent, created = Agent.objects.get_or_create(
        사용자ID=agent_profile,
        defaults={
            '중개사무소명': '테스트 중개사무소',
            '중개사등록번호': '12345-67890',
            '대표자명': '김중개',
            '사무소주소': '서울특별시 강남구 테헤란로 123',
            '사무소전화번호': '02-123-4567',
            '영업시간': '09:00-18:00',
            '서비스지역': '서울, 경기, 인천',
            '소개글': '신뢰할 수 있는 중개 서비스를 제공합니다.',
            '인증여부': True
        }
    )

    # 2. 지역 생성
    print("지역 데이터 생성 중...")

    regions_data = [
        {'시도': '서울특별시', '시군구': '강남구', '읍면동': '역삼동'},
        {'시도': '부산광역시', '시군구': '해운대구', '읍면동': '센텀동'},
        {'시도': '대전광역시', '시군구': '유성구', '읍면동': '봉명동'}
    ]

    regions = []
    for region_data in regions_data:
        region, created = Region.objects.get_or_create(
            시도=region_data['시도'],
            시군구=region_data['시군구'],
            읍면동=region_data['읍면동'],
            defaults={'활성화여부': True}
        )
        regions.append(region)
        if created:
            print(f"지역 생성: {region}")

    # 3. 매물 데이터 생성
    print("매물 데이터 생성 중...")

    properties_data = [
        {
            '등록사용자ID': user_profile,
            '관리중개사ID': agent,
            '지역ID': regions[0],  # 서울
            '매물타입': 'jeonse',
            '주택종류': 'apartment',
            '전세보증금': 300000000,  # 3억
            '주소': '서울특별시 강남구 역삼동 123-45',
            '도로명주소': '서울특별시 강남구 테헤란로 123',
            '상세주소': '456호',
            '위도': 37.5000,
            '경도': 127.0370,
            '월관리비': 150000,
            '주차정보': '세대당 1대 가능',
            '전용면적_제곱미터': 84.97,
            '전용면적_평': 25.72,
            '방수': 3,
            '욕실수': 2,
            '층수': '12/25',
            '현재층': 12,
            '총층수': 25,
            '준공년도': 2015,
            '공급면적_제곱미터': 109.23,
            '방향': '남동',
            '총세대수': 512,
            '총주차대수': 600,
            '현관유형': '계단식',
            '입주가능일': '즉시',
            '건축물용도': '공동주택(아파트)',
            '사용승인일': date(2015, 3, 15),
            '최초등록일': date(2024, 10, 1),
            '계약기간_개월': 24,
            '재계약가능여부': True,
            '대중교통점수': 8,
            '노선다양성점수': 4,
            '버스정류장정보': [
                {'stop_name': '역삼역', 'distance_m': 150, 'bus_numbers': ['146', '341', '360']}
            ],
            '지하철역정보': [
                {'station_name': '역삼역', 'line_names': ['2호선'], 'distance_m': 300}
            ],
            '편의시설요약': '역삼역 도보 5분, 강남대로변 편의시설 밀집 지역',
            '이미지URLs': ['/images/apt1.jpg'],
            'QA정보': [],
            '매물상태': 'available',
            '상세설명': '깨끗한 아파트 매물입니다.',
            '활성화여부': True
        },
        {
            '등록사용자ID': user_profile,
            '관리중개사ID': agent,
            '지역ID': regions[1],  # 부산
            '매물타입': 'monthly',
            '주택종류': 'officetel',
            '월세보증금': 50000000,  # 5천만
            '월세': 800000,  # 80만
            '주소': '부산광역시 해운대구 센텀동 456-78',
            '도로명주소': '부산광역시 해운대구 센텀중앙로 123',
            '상세주소': '789호',
            '위도': 35.1700,
            '경도': 129.1300,
            '월관리비': 120000,
            '주차정보': '주차 가능',
            '전용면적_제곱미터': 59.84,
            '전용면적_평': 18.09,
            '방수': 1,
            '욕실수': 1,
            '층수': '8/15',
            '현재층': 8,
            '총층수': 15,
            '준공년도': 2018,
            '공급면적_제곱미터': 72.45,
            '방향': '남',
            '총세대수': 120,
            '총주차대수': 80,
            '현관유형': '복도식',
            '입주가능일': '2024-12-01',
            '건축물용도': '업무시설',
            '사용승인일': date(2018, 6, 20),
            '최초등록일': date(2024, 10, 15),
            '계약기간_개월': 12,
            '재계약가능여부': True,
            '대중교통점수': 7,
            '노선다양성점수': 3,
            '버스정류장정보': [
                {'stop_name': '센텀시티', 'distance_m': 200, 'bus_numbers': ['181', '307']}
            ],
            '지하철역정보': [
                {'station_name': '센텀시티역', 'line_names': ['동해선'], 'distance_m': 500}
            ],
            '편의시설요약': '센텀시티 인근, 해수욕장 도보 10분',
            '이미지URLs': ['/images/officetel1.jpg'],
            'QA정보': [],
            '매물상태': 'available',
            '상세설명': '바다 조망 좋은 오피스텔입니다.',
            '활성화여부': True
        },
        {
            '등록사용자ID': user_profile,
            '관리중개사ID': agent,
            '지역ID': regions[2],  # 대전
            '매물타입': 'sale',
            '주택종류': 'villa',
            '매매가': 250000000,  # 2.5억
            '주소': '대전광역시 유성구 봉명동 789-12',
            '도로명주소': '대전광역시 유성구 봉명로 456',
            '상세주소': '단독주택',
            '위도': 36.3500,
            '경도': 127.3900,
            '월관리비': 80000,
            '주차정보': '주차 2대 가능',
            '전용면적_제곱미터': 120.5,
            '전용면적_평': 36.45,
            '방수': 4,
            '욕실수': 2,
            '층수': '2/2',
            '현재층': 2,
            '총층수': 2,
            '준공년도': 2010,
            '공급면적_제곱미터': 150.8,
            '방향': '북',
            '총세대수': 1,
            '총주차대수': 2,
            '현관유형': '계단식',
            '입주가능일': '즉시',
            '건축물용도': '단독주택',
            '사용승인일': date(2010, 8, 10),
            '최초등록일': date(2024, 10, 20),
            '계약기간_개월': None,
            '재계약가능여부': False,
            '대중교통점수': 6,
            '노선다양성점수': 2,
            '버스정류장정보': [
                {'stop_name': '봉명동', 'distance_m': 300, 'bus_numbers': ['102', '703']}
            ],
            '지하철역정보': [],
            '편의시설요약': '유성구청 인근, 조용한 주택가',
            '이미지URLs': ['/images/villa1.jpg'],
            'QA정보': [],
            '매물상태': 'available',
            '상세설명': '넓고 쾌적한 단독주택입니다.',
            '활성화여부': True
        }
    ]

    created_properties = []
    for i, prop_data in enumerate(properties_data, 1):
        # 매물 제목 생성 (화면 표시용)
        if prop_data['매물타입'] == 'jeonse':
            title = f"{prop_data['전용면적_평']:.0f}평 아파트"
        elif prop_data['매물타입'] == 'monthly':
            title = f"{prop_data['전용면적_평']:.0f}평 오피스텔"
        else:
            title = f"{prop_data['전용면적_평']:.0f}평 단독주택"

        property_obj, created = Property.objects.get_or_create(
            주소=prop_data['주소'],
            defaults=prop_data
        )
        if created:
            created_properties.append(property_obj)
            print(f"매물 생성: {title} - {prop_data['주소']}")

    print(f"\n총 {len(created_properties)}개의 매물이 생성되었습니다.")
    return created_properties

if __name__ == '__main__':
    try:
        create_dummy_data()
        print("더미 데이터 생성 완료!")
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
