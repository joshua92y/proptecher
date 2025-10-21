@echo off
echo ========================================
echo  PropTecher Full Stack Starting...
echo ========================================

echo.
echo Starting Backend (Django)...
start "Backend - Django" cmd /k "cd backend && call venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

timeout /t 3 >nul

echo.
echo Starting Frontend (Next.js)...
start "Frontend - Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Servers are starting...
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  Swagger:  http://localhost:8000/api/swagger/
echo ========================================
echo.
echo Press any key to close this window...
pause >nul








