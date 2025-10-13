#!/usr/bin/env python
"""
Docker 환경에서 시스템 테스트 스크립트
"""

import os
import sys
import django
from pathlib import Path

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.cache import cache
from locations.models import Sido
from locations.tasks import generate_sido_topojson, clear_topojson_cache


def test_docker_environment():
    """Docker 환경 테스트"""
    print("🐳 Docker 환경 테스트")
    print("=" * 50)
    
    # 환경변수 확인
    print("🔍 환경변수 확인:")
    env_vars = [
        'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME', 
        'DATABASE_USER', 'REDIS_HOST', 'REDIS_PORT'
    ]
    
    for var in env_vars:
        value = os.environ.get(var, 'Not Set')
        print(f"   {var}: {value}")
    
    print()
    
    # Mapshaper 설치 확인
    print("🔍 Mapshaper 설치 확인:")
    try:
        import subprocess
        result = subprocess.run(['mapshaper', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"   ✅ Mapshaper 버전: {result.stdout.strip()}")
        else:
            print(f"   ❌ Mapshaper 실행 실패: {result.stderr}")
    except FileNotFoundError:
        print("   ❌ Mapshaper 명령어를 찾을 수 없습니다.")
    except Exception as e:
        print(f"   ❌ Mapshaper 확인 중 오류: {e}")
    
    print()


def test_services_connection():
    """서비스 연결 테스트"""
    print("🔗 서비스 연결 테스트")
    print("=" * 50)
    
    # 데이터베이스 연결 테스트
    print("📊 PostgreSQL 연결 테스트:")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("   ✅ PostgreSQL 연결 성공")
            else:
                print("   ❌ PostgreSQL 쿼리 실패")
    except Exception as e:
        print(f"   ❌ PostgreSQL 연결 실패: {e}")
    
    # Dragonfly 캐시 연결 테스트
    print("\n💾 Dragonfly 캐시 연결 테스트:")
    try:
        cache.set('docker_test', 'success', timeout=10)
        value = cache.get('docker_test')
        if value == 'success':
            print("   ✅ Dragonfly 캐시 연결 성공")
            cache.delete('docker_test')
        else:
            print("   ❌ Dragonfly 캐시 값 불일치")
    except Exception as e:
        print(f"   ❌ Dragonfly 캐시 연결 실패: {e}")
    
    print()


def test_sido_data():
    """Sido 데이터 테스트"""
    print("🗺️  Sido 데이터 테스트")
    print("=" * 50)
    
    try:
        count = Sido.objects.count()
        print(f"📈 총 Sido 레코드 수: {count}")
        
        if count > 0:
            # 첫 번째 레코드 정보
            first_sido = Sido.objects.first()
            print(f"📍 첫 번째 레코드:")
            print(f"   - ID: {first_sido.id}")
            print(f"   - 이름: {first_sido.name}")
            print(f"   - Geometry 존재: {first_sido.geom is not None}")
            
            if first_sido.geom:
                print(f"   - SRID: {first_sido.geom.srid}")
                print(f"   - Geometry 타입: {first_sido.geom.geom_type}")
        else:
            print("⚠️  Sido 데이터가 없습니다. 데이터를 import해주세요.")
            
    except Exception as e:
        print(f"❌ Sido 데이터 테스트 실패: {e}")
    
    print()


def test_topojson_generation():
    """TopoJSON 생성 테스트"""
    print("🗺️  TopoJSON 생성 테스트")
    print("=" * 50)
    
    try:
        print("🔄 TopoJSON 생성 시작...")
        result = generate_sido_topojson()
        
        print(f"📊 생성 결과:")
        print(f"   - 상태: {result.get('status', 'unknown')}")
        print(f"   - 파일 경로: {result.get('file_path', 'N/A')}")
        print(f"   - Feature 개수: {result.get('feature_count', 0)}")
        
        if result.get('status') == 'success':
            file_path = result.get('file_path')
            if file_path and Path(file_path).exists():
                file_size = Path(file_path).stat().st_size
                print(f"   - 파일 크기: {file_size:,} bytes")
                print("   ✅ TopoJSON 파일 생성 성공!")
            else:
                print("   ❌ TopoJSON 파일이 생성되지 않았습니다.")
        else:
            print(f"   ❌ TopoJSON 생성 실패: {result.get('message', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ TopoJSON 생성 테스트 실패: {e}")
    
    print()


def test_cache_status():
    """캐시 상태 확인"""
    print("💾 캐시 상태 확인")
    print("=" * 50)
    
    try:
        cache_keys = {
            'sido_topojson_ready': '준비 상태',
            'sido_topojson_file': '파일 경로',
            'sido_topojson_time': '생성 시간',
            'sido_topojson_feature_count': 'Feature 개수',
            'sido_topojson_error': '오류 메시지'
        }
        
        for key, description in cache_keys.items():
            value = cache.get(key)
            if value is not None:
                print(f"   {description}: {value}")
            else:
                print(f"   {description}: 설정되지 않음")
                
    except Exception as e:
        print(f"❌ 캐시 상태 확인 실패: {e}")
    
    print()


def main():
    """메인 테스트 함수"""
    print("🐳 Docker + Mapshaper TopoJSON 시스템 테스트")
    print("=" * 60)
    print()
    
    tests = [
        ("Docker 환경", test_docker_environment),
        ("서비스 연결", test_services_connection),
        ("Sido 데이터", test_sido_data),
        ("TopoJSON 생성", test_topojson_generation),
        ("캐시 상태", test_cache_status),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            test_func()
            results.append((test_name, True))
        except Exception as e:
            print(f"❌ {test_name} 테스트 중 예외 발생: {e}")
            results.append((test_name, False))
    
    print("=" * 60)
    print("📊 테스트 결과 요약:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ 통과" if result else "❌ 실패"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n총 {len(results)}개 테스트 중 {passed}개 통과")
    
    if passed == len(results):
        print("🎉 모든 테스트 통과! Docker 시스템이 정상적으로 작동합니다.")
    else:
        print("⚠️  일부 테스트 실패. Docker 로그를 확인해주세요.")
    
    print("\n💡 유용한 명령어:")
    print("   - 로그 확인: docker-logs.bat [서비스명]")
    print("   - 서비스 상태: docker-compose -f docker-compose.dev.yml ps")
    print("   - 서비스 재시작: docker-compose -f docker-compose.dev.yml restart [서비스명]")


if __name__ == "__main__":
    main()
