@echo off
REM Dragonfly 서버 실행 스크립트 (Windows)

echo Starting Dragonfly Server...
echo.

REM Dragonfly 서버 실행 (Redis 호환)
dragonfly --logtostderr --port=6379

pause
