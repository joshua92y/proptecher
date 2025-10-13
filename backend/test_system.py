#!/usr/bin/env python
"""
Django + Celery + PostGIS + Dragonfly TopoJSON 생성 시스템 테스트 스크립트
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
from locations.signals import invalidate_topojson_cache_manually


def test_cache_connection():
    """Dragonfly 캐시 연결 테스트"""
    print("🔍 Dragonfly 캐시 연결 테스트...")
    
    try:
        # 테스트 키 설정
        cache.set('test_key', 'test_value', timeout=10)
        value = cache.get('test_key')
        
        if value == 'test_value':
            print("✅ Dragonfly 캐시 연결 성공!")
            cache.delete('test_key')
            return True
        else:
            print("❌ Dragonfly 캐시 값 불일치")
            return False
            
    except Exception as e:
        print(f"❌ Dragonfly 캐시 연결 실패: {e}")
        return False


def test_sido_model():
    """Sido 모델 접근 테스트"""
    print("\n🔍 Sido 모델 접근 테스트...")
    
    try:
        # Sido 모델 조회
        count = Sido.objects.count()
        print(f"✅ Sido 모델 접근 성공! 총 {count}개 레코드")
        
        if count > 0:
            # 첫 번째 레코드 조회
            first_sido = Sido.objects.first()
            print(f"   - 첫 번째 레코드: {first_sido}")
            print(f"   - Geometry 존재: {first_sido.geom is not None}")
            
        return True
        
    except Exception as e:
        print(f"❌ Sido 모델 접근 실패: {e}")
        return False


def test_celery_tasks():
    """Celery Task 테스트"""
    print("\n🔍 Celery Task 테스트...")
    
    try:
        # 캐시 정리 Task
        result = clear_topojson_cache.delay()
        print(f"✅ 캐시 정리 Task 실행: {result.id}")
        
        # TopoJSON 생성 Task (비동기)
        result = generate_sido_topojson.delay()
        print(f"✅ TopoJSON 생성 Task 실행: {result.id}")
        print("   (실제 결과는 Celery Worker가 실행 중일 때 확인 가능)")
        print("   Docker 환경에서는 'docker-logs.bat celery_worker'로 로그 확인")
        
        return True
        
    except Exception as e:
        print(f"❌ Celery Task 실행 실패: {e}")
        print("   Docker 환경에서는 'start_docker.bat'로 Celery Worker를 시작하세요.")
        return False


def test_topojson_generation():
    """TopoJSON 생성 테스트 (동기)"""
    print("\n🔍 TopoJSON 생성 테스트 (동기)...")
    
    try:
        # 동기적으로 TopoJSON 생성
        result = generate_sido_topojson()
        print(f"✅ TopoJSON 생성 완료!")
        print(f"   - 상태: {result.get('status', 'unknown')}")
        print(f"   - 파일 경로: {result.get('file_path', 'N/A')}")
        print(f"   - Feature 개수: {result.get('feature_count', 0)}")
        
        # 파일 존재 확인
        file_path = result.get('file_path')
        if file_path and Path(file_path).exists():
            file_size = Path(file_path).stat().st_size
            print(f"   - 파일 크기: {file_size:,} bytes")
        
        return True
        
    except Exception as e:
        print(f"❌ TopoJSON 생성 실패: {e}")
        return False


def test_cache_status():
    """캐시 상태 확인"""
    print("\n🔍 TopoJSON 캐시 상태 확인...")
    
    try:
        is_ready = cache.get('sido_topojson_ready', False)
        file_path = cache.get('sido_topojson_file')
        generated_at = cache.get('sido_topojson_time')
        feature_count = cache.get('sido_topojson_feature_count', 0)
        error_msg = cache.get('sido_topojson_error')
        
        print(f"   - 준비 상태: {is_ready}")
        print(f"   - 파일 경로: {file_path}")
        print(f"   - 생성 시간: {generated_at}")
        print(f"   - Feature 개수: {feature_count}")
        
        if error_msg:
            print(f"   - 오류 메시지: {error_msg}")
        
        if is_ready and file_path:
            file_path_obj = Path(file_path)
            if file_path_obj.exists():
                file_size = file_path_obj.stat().st_size
                print(f"   - 파일 크기: {file_size:,} bytes")
                print("✅ TopoJSON 파일 존재 확인!")
            else:
                print("❌ TopoJSON 파일이 존재하지 않습니다.")
        
        return True
        
    except Exception as e:
        print(f"❌ 캐시 상태 확인 실패: {e}")
        return False


def main():
    """메인 테스트 함수"""
    print("🚀 Django + Celery + PostGIS + Dragonfly TopoJSON 시스템 테스트")
    print("=" * 70)
    
    tests = [
        ("Dragonfly 캐시 연결", test_cache_connection),
        ("Sido 모델 접근", test_sido_model),
        ("Celery Task 실행", test_celery_tasks),
        ("TopoJSON 생성", test_topojson_generation),
        ("캐시 상태 확인", test_cache_status),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} 테스트 중 예외 발생: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 70)
    print("📊 테스트 결과 요약:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ 통과" if result else "❌ 실패"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n총 {len(results)}개 테스트 중 {passed}개 통과")
    
    if passed == len(results):
        print("🎉 모든 테스트 통과! 시스템이 정상적으로 작동합니다.")
    else:
        print("⚠️  일부 테스트 실패. 설정을 확인해주세요.")
    
    print("\n💡 다음 단계:")
    print("   1. Docker 환경 시작: start_docker.bat")
    print("   2. 서비스 상태 확인: docker-compose -f docker-compose.dev.yml ps")
    print("   3. API 테스트: http://localhost:8000/api/topojson/sido/")
    print("   4. 모니터링: http://localhost:5555 (Celery Flower)")
    print("   5. 로그 확인: docker-logs.bat [서비스명]")


if __name__ == "__main__":
    main()
