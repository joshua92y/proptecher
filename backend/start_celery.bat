@echo off
REM Celery Worker 실행 스크립트 (Windows)

echo Starting Celery Worker...
echo.

REM 가상환경 활성화 (필요시 주석 해제)
REM call venv\Scripts\activate

REM Celery Worker 실행
celery -A config worker --loglevel=info --pool=solo

pause
