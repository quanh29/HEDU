#!/usr/bin/env pwsh

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  MUX Upload Debug Tool" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "[OK]" -ForegroundColor Green -NoNewline
    Write-Host " .env file found"
} else {
    Write-Host "[ERROR]" -ForegroundColor Red -NoNewline
    Write-Host " .env file not found!"
    Write-Host "Create .env file in backend directory" -ForegroundColor Yellow
    exit 1
}

# Check environment variables
Write-Host ""
Write-Host "Checking environment variables..." -ForegroundColor Cyan

# Load .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$requiredVars = @("MUX_TOKEN_ID", "MUX_SECRET_KEY")

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        Write-Host "[OK]" -ForegroundColor Green -NoNewline
        Write-Host " $var is set"
    } else {
        Write-Host "[ERROR]" -ForegroundColor Red -NoNewline
        Write-Host " $var is missing!"
    }
}

# Run tests
Write-Host ""
Write-Host "Running environment check..." -ForegroundColor Cyan
node check-env.js

Write-Host ""
Write-Host "Running MUX connection test..." -ForegroundColor Cyan
node test-mux.js

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Debug complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
