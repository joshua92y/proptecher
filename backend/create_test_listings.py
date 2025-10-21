#!/usr/bin/env python
"""
테스트용 매물 데이터 생성 스크립트
"""
import os
import django
from datetime import date

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from listings.models import Listing
from users.models import UserProfile
from django.contrib.auth.models import User

def create_test_user():
    """테스트 사용자 생성"""
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'is_active': True
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✅ 테스트 사용자 생성: {user.username}")
    
    # UserProfile 생성
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            '사용자유형': 'user',
            '연락처': '010-1234-5678'
        }
    )
    if created:
        print(f"✅ 사용자 프로필 생성: {profile.user.username}")
    
    return profile


def create_test_listings():
    """테스트 매물 데이터 생성"""
    profile = create_test_user()
    
    # 기존 테스트 매물 삭제
    Listing.objects.filter(등록사용자ID=profile).delete()
    print("\n🗑️  기존 테스트 매물 삭제 완료\n")
    
    test_listings = [
        {
            '매물타입': 'jeonse',
            '주택종류': 'apartment',
            '전세보증금': 320000000,  # 3.2억
            '주소': '서울특별시 강남구 테헤란로 123',
            '도로명주소': '서울특별시 강남구 테헤란로 123',
            '위도': 37.504896,
            '경도': 127.048326,
            '월관리비': 120000,
            '주차정보': '주차 1대',
            '전용면적_제곱미터': 84.97,
            '전용면적_평': 25.72,
            '공급면적_제곱미터': 109.23,
            '방수': 3,
            '욕실수': 2,
            '층수': '12/25',
            '현재층': 12,
            '총층수': 25,
            '준공년도': 2008,
            '방향': '남동',
            '총세대수': 512,
            '총주차대수': 600,
            '현관유형': '계단식',
            '입주가능일': '즉시',
            '건축물용도': '공동주택(아파트)',
            '사용승인일': date(2008, 9, 15),
            '최초등록일': date(2025, 10, 3),
            '계약기간_개월': 24,
            '재계약가능여부': True,
            '대중교통점수': 8,
            '노선다양성점수': 4,
            '버스정류장정보': [
                {
                    'stop_name': '선릉역.르네상스호텔',
                    'distance_m': 180,
                    'bus_numbers': ['146', '341', '360']
                },
                {
                    'stop_name': '강남역 10번출구',
                    'distance_m': 320,
                    'bus_numbers': ['140', '148', '360']
                }
            ],
            '지하철역정보': [
                {
                    'station_name': '선릉역',
                    'line_names': ['2호선', '수인분당선'],
                    'distance_m': 420
                },
                {
                    'station_name': '강남역',
                    'line_names': ['2호선', '신분당선'],
                    'distance_m': 650
                }
            ],
            '이미지URLs': [
                '/images/house1.jpg',
                '/images/house2.jpg',
                '/images/house3.jpg'
            ],
            '편의시설요약': '도보 5분 내 편의점, 카페, 식당 밀집. GS25, 스타벅스, 맥도날드 등',
            'QA정보': [],
            '상세설명': '강남역 인근 신축 아파트입니다. 교통이 매우 편리하며 주변 편의시설이 우수합니다.',
            '활성화여부': True,
            '매물상태': 'available'
        },
        {
            '매물타입': 'monthly',
            '주택종류': 'oneroom',
            '월세보증금': 10000000,  # 1천만원
            '월세': 600000,  # 60만원
            '주소': '서울특별시 마포구 상암동 DMC로 123',
            '도로명주소': '서울특별시 마포구 상암동 DMC로 123',
            '위도': 37.579617,
            '경도': 126.889497,
            '월관리비': 80000,
            '주차정보': '불가',
            '전용면적_제곱미터': 33.05,
            '전용면적_평': 10.0,
            '방수': 1,
            '욕실수': 1,
            '층수': '5/12',
            '현재층': 5,
            '총층수': 12,
            '준공년도': 2015,
            '방향': '남향',
            '입주가능일': '2025-11-01',
            '건축물용도': '다가구주택',
            '계약기간_개월': 12,
            '재계약가능여부': True,
            '대중교통점수': 9,
            '노선다양성점수': 5,
            '버스정류장정보': [
                {
                    'stop_name': '상암월드컵경기장',
                    'distance_m': 120,
                    'bus_numbers': ['271', '710', '750A']
                }
            ],
            '지하철역정보': [
                {
                    'station_name': '디지털미디어시티역',
                    'line_names': ['6호선', '공항철도', '경의중앙선'],
                    'distance_m': 280
                }
            ],
            '이미지URLs': [
                '/images/room1.jpg',
                '/images/room2.jpg'
            ],
            '편의시설요약': 'CGV, 롯데마트, 스타필드 고양 인접',
            'QA정보': [],
            '상세설명': 'DMC 역세권 원룸입니다. 신축 건물로 깨끗하고 교통이 편리합니다.',
            '활성화여부': True,
            '매물상태': 'available'
        },
        {
            '매물타입': 'sale',
            '주택종류': 'apartment',
            '매매가': 1500000000,  # 15억
            '주소': '서울특별시 송파구 잠실동 올림픽로 300',
            '도로명주소': '서울특별시 송파구 잠실동 올림픽로 300',
            '위도': 37.511922,
            '경도': 127.098205,
            '월관리비': 200000,
            '주차정보': '세대당 2대',
            '전용면적_제곱미터': 131.45,
            '전용면적_평': 39.77,
            '공급면적_제곱미터': 165.29,
            '방수': 4,
            '욕실수': 3,
            '층수': '18/25',
            '현재층': 18,
            '총층수': 25,
            '준공년도': 2018,
            '방향': '남향',
            '총세대수': 1024,
            '총주차대수': 2048,
            '현관유형': '복도식',
            '입주가능일': '협의',
            '건축물용도': '공동주택(아파트)',
            '사용승인일': date(2018, 5, 20),
            '최초등록일': date(2025, 9, 15),
            '대중교통점수': 10,
            '노선다양성점수': 5,
            '버스정류장정보': [
                {
                    'stop_name': '잠실역 2번출구',
                    'distance_m': 250,
                    'bus_numbers': ['303', '320', '3217', '3313']
                }
            ],
            '지하철역정보': [
                {
                    'station_name': '잠실역',
                    'line_names': ['2호선', '8호선'],
                    'distance_m': 300
                },
                {
                    'station_name': '잠실새내역',
                    'line_names': ['2호선'],
                    'distance_m': 450
                }
            ],
            '이미지URLs': [
                '/images/apt1.jpg',
                '/images/apt2.jpg',
                '/images/apt3.jpg',
                '/images/apt4.jpg'
            ],
            '편의시설요약': '롯데월드, 롯데마트, 석촌호수 인근. 초/중/고등학교 도보 10분',
            'QA정보': [],
            '상세설명': '잠실 신축 아파트입니다. 학군 우수, 교통 편리, 대형 쇼핑몰 인접으로 생활 인프라가 완벽합니다.',
            '활성화여부': True,
            '매물상태': 'available'
        },
        {
            '매물타입': 'jeonse',
            '주택종류': 'apartment',
            '전세보증금': 255000000,  # 2.55억
            '주소': '전북 무주군 무주읍 적천로 343',
            '도로명주소': '전북 무주군 무주읍 적천로 343',
            '위도': 35.000000,
            '경도': 127.000000,
            '월관리비': 50000,
            '주차정보': '세대당 1대',
            '전용면적_제곱미터': 59.5,
            '전용면적_평': 18.0,
            '방수': 2,
            '욕실수': 1,
            '층수': '3/5',
            '현재층': 3,
            '총층수': 5,
            '준공년도': 2010,
            '방향': '남서향',
            '입주가능일': '즉시',
            '건축물용도': '다가구주택',
            '계약기간_개월': 24,
            '재계약가능여부': True,
            '대중교통점수': 5,
            '노선다양성점수': 2,
            '버스정류장정보': [
                {
                    'stop_name': '무주읍사무소',
                    'distance_m': 200,
                    'bus_numbers': ['171', '172']
                }
            ],
            '지하철역정보': [],
            '이미지URLs': [
                '/images/house1.jpg'
            ],
            '편의시설요약': '무주읍내 중심가, 편의점/약국 도보 5분',
            'QA정보': [],
            '상세설명': '무주읍 중심가 전세 매물입니다.',
            '활성화여부': True,
            '매물상태': 'available'
        },
    ]
    
    created_count = 0
    for listing_data in test_listings:
        listing_data['등록사용자ID'] = profile
        listing = Listing.objects.create(**listing_data)
        created_count += 1
        print(f"✅ [{created_count}] {listing.get_매물타입_display()} - {listing.주소[:30]}... (ID: {listing.id})")
    
    print(f"\n✨ 총 {created_count}개의 테스트 매물이 생성되었습니다!\n")
    print("=" * 60)
    print("📊 생성된 매물 통계:")
    print(f"   - 전세: {Listing.objects.filter(매물타입='jeonse').count()}건")
    print(f"   - 월세: {Listing.objects.filter(매물타입='monthly').count()}건")
    print(f"   - 매매: {Listing.objects.filter(매물타입='sale').count()}건")
    print("=" * 60)
    print("\n🔗 API 테스트:")
    print("   - 목록: http://localhost:8000/api/listings/")
    print("   - 상세: http://localhost:8000/api/listings/1/")
    print("   - Swagger: http://localhost:8000/api/swagger/")
    print()


if __name__ == '__main__':
    create_test_listings()






