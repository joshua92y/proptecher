@echo off
REM Docker 기반 시스템 실행 스크립트 (Windows)

echo ========================================
echo  Django + Celery + PostGIS + Dragonfly
echo  TopoJSON 생성 시스템 (Docker 버전)
echo ========================================
echo.

echo Docker 및 Docker Compose가 설치되어 있는지 확인...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker가 설치되어 있지 않습니다.
    echo    Docker Desktop을 설치해주세요: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose가 설치되어 있지 않습니다.
    pause
    exit /b 1
)

echo ✅ Docker 및 Docker Compose 확인 완료
echo.

echo 🚀 시스템 시작 중...
echo.

REM Docker Compose로 모든 서비스 시작
echo 📦 Docker 이미지 빌드 및 서비스 시작...
docker-compose -f docker-compose.dev.yml up --build -d

if %errorlevel% neq 0 (
    echo ❌ Docker Compose 실행 실패
    pause
    exit /b 1
)

echo.
echo ✅ 모든 서비스가 시작되었습니다!
echo.

echo 📋 실행 중인 서비스:
echo    - Django 웹 서버: http://localhost:8000
echo    - Celery Flower (모니터링): http://localhost:5555
echo    - PostgreSQL: localhost:5432
echo    - Dragonfly: localhost:6379
echo.

echo 🔍 서비스 상태 확인:
docker-compose -f docker-compose.dev.yml ps

echo.
echo 💡 유용한 명령어:
echo    - 로그 확인: docker-compose -f docker-compose.dev.yml logs -f
echo    - 서비스 중지: docker-compose -f docker-compose.dev.yml down
echo    - 재시작: docker-compose -f docker-compose.dev.yml restart
echo.

echo 🎯 API 테스트:
echo    - TopoJSON API: http://localhost:8000/api/topojson/sido/
echo    - TopoJSON 상태: http://localhost:8000/api/topojson/sido/status/
echo    - Sido 목록: http://localhost:8000/api/locations/sido/
echo.

echo 시스템이 준비되었습니다! 아무 키나 누르면 종료합니다.
pause
