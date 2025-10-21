"""
임장 샘플 데이터 생성 스크립트
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = '임장 요청 샘플 데이터를 생성합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='생성할 임장 요청 수 (기본값: 10)'
        )

    def handle(self, *args, **options):
        from listings.models import Listing
        from users.models import UserProfile
        from agents.models import Agent
        from inspections.models import InspectionRequest, ActiveInspection
        from django.contrib.auth.models import User

        count = options['count']
        
        # 매물 가져오기
        listings = list(Listing.objects.all()[:20])
        if not listings:
            self.stdout.write(self.style.WARNING('매물이 없습니다. 먼저 매물 데이터를 생성하세요.'))
            return

        # 사용자 프로필 가져오기 또는 생성
        users = list(UserProfile.objects.all()[:5])
        if not users:
            self.stdout.write('사용자 프로필이 없어 새로 생성합니다...')
            for i in range(3):
                user, _ = User.objects.get_or_create(
                    username=f'testuser{i+1}',
                    defaults={
                        'email': f'testuser{i+1}@example.com',
                        'first_name': f'테스트유저{i+1}'
                    }
                )
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'사용자유형': 'user', '연락처': f'010-1111-111{i}'}
                )
                users.append(profile)

        # 평가사 가져오기 또는 생성
        agents = list(Agent.objects.all()[:3])
        if not agents:
            self.stdout.write('평가사가 없어 새로 생성합니다...')
            for i in range(2):
                user, _ = User.objects.get_or_create(
                    username=f'agent{i+1}',
                    defaults={
                        'email': f'agent{i+1}@example.com',
                        'first_name': f'평가사{i+1}'
                    }
                )
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'사용자유형': 'agent', '연락처': f'010-2222-222{i}'}
                )
                agent, _ = Agent.objects.get_or_create(
                    사용자ID=profile,
                    defaults={
                        '중개사무소명': f'테스트부동산{i+1}',
                        '중개사등록번호': f'TEST-{i+1:04d}',
                        '대표자명': f'평가사{i+1}',
                        '사무소주소': f'서울시 강남구 테스트동 {i+1}번지',
                        '사무소전화번호': f'02-1234-567{i}',
                        '인증여부': True,
                        '활성화여부': True
                    }
                )
                agents.append(agent)

        self.stdout.write('임장 요청 데이터 생성 시작...')
        
        created_requests = 0
        created_active = 0

        for i in range(count):
            listing = random.choice(listings)
            user_profile = random.choice(users)
            
            # 희망 날짜 (내일부터 2주 이내)
            days_ahead = random.randint(1, 14)
            preferred_date = (timezone.now() + timedelta(days=days_ahead)).date()
            
            # 매물 정보 스냅샷
            price_text = ''
            if listing.매매가:
                price_text = f'매매 {listing.매매가:,}원'
            elif listing.전세보증금:
                price_text = f'전세 {listing.전세보증금:,}원'
            elif listing.월세:
                price_text = f'월세 {listing.월세보증금:,}/{listing.월세:,}원'
            
            # 임장 요청 생성
            inspection = InspectionRequest.objects.create(
                매물ID=listing,
                요청자ID=user_profile,
                희망날짜=preferred_date,
                연락처=f'010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
                요청사항=f'임장 요청 사항 {i+1}' if random.random() > 0.5 else '',
                매물제목=f'{listing.주소[:20]}...',
                매물주소=listing.주소,
                가격정보=price_text,
                임장비=random.choice([100000, 150000, 200000]),
                매물이미지URL=None,
                매물설명=listing.상세설명 if hasattr(listing, '상세설명') else '',
                상태=random.choice(['requested', 'requested', 'requested', 'accepted']),  # 75% requested
            )
            created_requests += 1
            
            # 일부는 ActiveInspection으로 생성 (수락된 상태)
            if inspection.상태 == 'accepted' and agents:
                agent = random.choice(agents)
                inspection.담당평가사ID = agent
                inspection.수락일시 = timezone.now() - timedelta(days=random.randint(1, 7))
                inspection.save()
                
                ActiveInspection.objects.create(
                    요청ID=inspection,
                    평가사ID=agent,
                    진행률=random.choice([0, 10, 25, 50, 75]),
                    평가사메모=f'진행 중인 임장 {i+1}' if random.random() > 0.5 else ''
                )
                created_active += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ 임장 데이터 생성 완료!\n'
                f'  - 임장 요청: {created_requests}개\n'
                f'  - 진행중인 임장: {created_active}개'
            )
        )

