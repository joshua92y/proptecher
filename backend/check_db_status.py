#!/usr/bin/env python
"""
현재 DB 상태를 확인하는 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from locations.models import BusStop, Sido, Region
from listings.models import Listing
from users.models import UserProfile
from agents.models import Agent

def check_db_status():
    print("🗄️ 현재 DB 상태 확인")
    print("=" * 50)
    
    try:
        bus_stops = BusStop.objects.count()
        print(f"📍 버스정류장: {bus_stops:,}개")
        
        sidos = Sido.objects.count()
        print(f"🗺️ 시도 정보: {sidos}개")
        
        listings = Listing.objects.count()
        print(f"🏠 매물: {listings}개")
        
        users = UserProfile.objects.count()
        print(f"👤 사용자: {users}명")
        
        agents = Agent.objects.count()
        print(f"🏢 중개사: {agents}명")
        
        regions = Region.objects.count()
        print(f"🌍 지역: {regions}개")
        
        print("\n✅ 모든 테이블 정상 작동")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    check_db_status()
