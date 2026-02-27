# Start Python AI Service
Write-Host "🚀 Starting VeriResume Python AI Service..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (Test-Path "venv") {
    Write-Host "✓ Virtual environment found" -ForegroundColor Green
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "⚠ No virtual environment found. Using global Python." -ForegroundColor Yellow
}

# Check if OpenAI API key is set
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found! Please create it with OPENAI_API_KEY" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting Flask server on port 5001..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the Python service
python app.py
