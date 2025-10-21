# backend/run.ps1
# PowerShell startup script for Listing API (UTF-8 safe)

# Set UTF-8 encoding for PowerShell
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# Set environment variables
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
$env:PYTHONLEGACYWINDOWSSTDIO = "utf-8"
$env:LC_ALL = "en_US.UTF-8"
$env:LANG = "en_US.UTF-8"

Write-Host "========================================"
Write-Host "   Listing API Startup"
Write-Host "========================================"
Write-Host ""

# Step 1: Start Docker
Write-Host "[1/4] Starting Docker containers..."
docker-compose up -d postgres dragonfly

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker failed. Check if Docker Desktop is running." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Docker containers started" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for database
Write-Host "[2/4] Waiting for database (5 seconds)..."
Start-Sleep -Seconds 5
Write-Host ""

# Step 3: Run migrations
Write-Host "[3/4] Running migrations..."

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

python manage.py makemigrations listings
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] makemigrations failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Migration failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try these manual steps:" -ForegroundColor Yellow
    Write-Host "  1. cd backend"
    Write-Host "  2. `$env:PYTHONIOENCODING='utf-8'"
    Write-Host "  3. .\venv\Scripts\Activate.ps1"
    Write-Host "  4. python manage.py migrate"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Migrations completed" -ForegroundColor Green
Write-Host ""

# Step 4: Start server
Write-Host "[4/4] Starting Django server..."
Write-Host ""
Write-Host "========================================"
Write-Host "   Server is ready!"
Write-Host "========================================"
Write-Host ""
Write-Host "Swagger UI: http://localhost:8000/api/swagger/"
Write-Host "API: http://localhost:8000/api/listings/"
Write-Host ""
Write-Host "Press Ctrl+C to stop"
Write-Host "========================================"
Write-Host ""

python manage.py runserver

