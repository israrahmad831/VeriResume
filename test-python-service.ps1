# Test Python AI Service Endpoints
Write-Host "`n=== Testing Python AI Service ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5001"

# Test 1: Health Check
Write-Host "[1] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✅ Status: $($response.status)" -ForegroundColor Green
    Write-Host "   ✅ AI Provider: $($response.ai_provider)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Parse Resume (need a sample file)
Write-Host "[2] Testing Parse Resume Endpoint..." -ForegroundColor Yellow
Write-Host "   Note: Requires uploading a file - test manually through frontend" -ForegroundColor Gray

Write-Host ""

# Test 3: Analyze Resume
Write-Host "[3] Testing Analyze Resume Endpoint..." -ForegroundColor Yellow
try {
    $analyzeData = @{
        resumeText = "John Doe - Software Engineer with 5 years experience in Python, JavaScript, React"
        jobDescription = "Looking for a Senior Software Engineer with Python and React experience"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/analyze-resume" `
        -Method Post `
        -Body $analyzeData `
        -ContentType "application/json" `
        -TimeoutSec 30

    if ($response.success) {
        Write-Host "   ✅ Analysis successful" -ForegroundColor Green
        Write-Host "   ATS Score: $($response.data.ats_score)%" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Analysis failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Analyze endpoint error: $_" -ForegroundColor Red
    Write-Host "   This might be expected if AI service has issues" -ForegroundColor Gray
}

Write-Host ""

# Test 4: Detect Fraud
Write-Host "[4] Testing Fraud Detection Endpoint..." -ForegroundColor Yellow
try {
    $fraudData = @{
        resumeText = "Test resume content"
        parsedData = @{
            name = "Test User"
            email = "test@example.com"
            skills = @("Python", "JavaScript")
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/detect-fraud" `
        -Method Post `
        -Body $fraudData `
        -ContentType "application/json" `
        -TimeoutSec 30

    if ($response.success) {
        Write-Host "   ✅ Fraud detection successful" -ForegroundColor Green
        Write-Host "   Risk Level: $($response.data.risk_level)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Fraud detection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Fraud detection error: $_" -ForegroundColor Red
    Write-Host "   This might be expected if AI service has issues" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If any tests failed, check:" -ForegroundColor Yellow
Write-Host "  1. Python AI service is running (port 5001)" -ForegroundColor White
Write-Host "  2. Groq API key is valid" -ForegroundColor White
Write-Host "  3. Check Python service PowerShell window for errors" -ForegroundColor White
Write-Host ""
