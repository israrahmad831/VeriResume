# VeriResume - Quick Start Script (PowerShell)
# This script helps you start all services in the correct order

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VeriResume - AI Resume Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "[1/3] Checking MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if (!$mongoProcess) {
    Write-Host "MongoDB is not running. Starting MongoDB..." -ForegroundColor Red
    Start-Process "mongod" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "MongoDB started successfully!" -ForegroundColor Green
} else {
    Write-Host "MongoDB is already running!" -ForegroundColor Green
}
Write-Host ""

# Start Python AI Service
Write-Host "[2/3] Starting Python AI Service (Port 5001)..." -ForegroundColor Yellow
$pythonServicePath = "c:\Users\saada\OneDrive\Desktop\FYP\python VS code\website-VeriResume\python-service"
$pythonExe = "c:\Users\saada\OneDrive\Desktop\FYP\python VS code\venv\Scripts\python.exe"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pythonServicePath'; Write-Host 'Python AI Service' -ForegroundColor Cyan; & '$pythonExe' app.py"
Write-Host "Python AI Service starting..." -ForegroundColor Green
Start-Sleep -Seconds 5
Write-Host ""

# Start Node.js Backend
Write-Host "[3/3] Starting Node.js Backend (Port 3000)..." -ForegroundColor Yellow
$backendPath = "c:\Users\saada\OneDrive\Desktop\FYP\python VS code\website-VeriResume\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Node.js Backend' -ForegroundColor Green; npm start"
Write-Host "Node.js Backend starting..." -ForegroundColor Green
Start-Sleep -Seconds 5
Write-Host ""

# Start React Frontend
Write-Host "Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
$frontendPath = "c:\Users\saada\OneDrive\Desktop\FYP\python VS code\website-VeriResume\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'React Frontend' -ForegroundColor Magenta; npm run dev"
Write-Host "React Frontend starting..." -ForegroundColor Green
Start-Sleep -Seconds 5
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Yellow
Write-Host "  Frontend:      http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:   http://localhost:3000" -ForegroundColor White
Write-Host "  Python AI:     http://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "Admin Login:" -ForegroundColor Yellow
Write-Host "  Email:    saadabdullah7216@gmail.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (services will continue running)" -ForegroundColor Gray
Write-Host "To stop all services, close the opened PowerShell windows" -ForegroundColor Gray
Write-Host ""

# Keep the script running
while ($true) {
    Start-Sleep -Seconds 60
}
