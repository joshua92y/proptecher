@echo off
REM PostgreSQL 데이터베이스 복원 스크립트
echo 🗄️ 데이터베이스 복원 시작...

REM 백업 파일 선택
echo 사용 가능한 백업 파일:
dir db_backup_*.sql /b 2>nul
echo.

set /p backup_file="복원할 백업 파일명을 입력하세요: "

if not exist "%backup_file%" (
    echo ❌ 파일을 찾을 수 없습니다: %backup_file%
    pause
    exit /b 1
)

echo 🔄 복원 중: %backup_file%
docker-compose exec -T postgres psql -U postgres -d postgres < "%backup_file%"

if %errorlevel% equ 0 (
    echo ✅ 복원 완료!
    echo 🧪 DB 상태 확인 중...
    docker-compose exec web python check_db_status.py
) else (
    echo ❌ 복원 실패
)

pause
