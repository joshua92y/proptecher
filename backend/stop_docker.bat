@echo off
REM Docker 서비스 중지 스크립트 (Windows)

echo ========================================
echo  Docker 서비스 중지
echo ========================================
echo.

echo 🛑 Docker 서비스 중지 중...
echo.

REM Docker Compose로 모든 서비스 중지
docker-compose -f docker-compose.dev.yml down

if %errorlevel% neq 0 (
    echo ❌ Docker Compose 중지 실패
    pause
    exit /b 1
)

echo ✅ 모든 서비스가 중지되었습니다!
echo.

echo 💡 추가 옵션:
echo    - 볼륨도 함께 삭제: docker-compose -f docker-compose.dev.yml down -v
echo    - 이미지도 함께 삭제: docker-compose -f docker-compose.dev.yml down --rmi all
echo.

pause
