@echo off
REM PostgreSQL 데이터베이스 백업 스크립트
echo 🗄️ 데이터베이스 백업 시작...

REM 현재 시간으로 백업 파일명 생성
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%"

REM 백업 파일 생성
docker-compose exec -T postgres pg_dump -U postgres postgres > "db_backup_%timestamp%.sql"

if %errorlevel% equ 0 (
    echo ✅ 백업 완료: db_backup_%timestamp%.sql
    echo 📁 파일 크기:
    dir "db_backup_%timestamp%.sql" | findstr "db_backup"
) else (
    echo ❌ 백업 실패
)

pause
