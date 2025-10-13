@echo off
REM Docker 로그 확인 스크립트 (Windows)

echo ========================================
echo  Docker 서비스 로그 확인
echo ========================================
echo.

if "%1"=="" (
    echo 📋 사용법: docker-logs.bat [서비스명]
    echo.
    echo 사용 가능한 서비스:
    echo    web           - Django 웹 서버
    echo    celery_worker - Celery Worker
    echo    celery_flower - Celery Flower
    echo    postgres      - PostgreSQL 데이터베이스
    echo    dragonfly     - Dragonfly 서버
    echo    all           - 모든 서비스 (기본값)
    echo.
    echo 예시:
    echo    docker-logs.bat web
    echo    docker-logs.bat celery_worker
    echo.
    set service=all
) else (
    set service=%1
)

echo 🔍 %service% 서비스 로그 확인 중...
echo    (Ctrl+C로 종료)
echo.

if "%service%"=="all" (
    docker-compose -f docker-compose.dev.yml logs -f
) else (
    docker-compose -f docker-compose.dev.yml logs -f %service%
)

pause
