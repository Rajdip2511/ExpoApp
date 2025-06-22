# Real-Time Event Check-In App - Frontend Startup Script
# This script starts the React Native Expo web frontend

Write-Host "🌐 Starting Real-Time Event Check-In Frontend" -ForegroundColor Green
Write-Host "📱 Framework: React Native Expo" -ForegroundColor Cyan
Write-Host "🎨 UI: Material Design 3" -ForegroundColor Yellow
Write-Host "🔐 Auth: JWT Token Selection" -ForegroundColor Magenta
Write-Host ""

# Change to mobile-app directory
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Start the frontend web server
Write-Host "🎯 Starting Expo web server..." -ForegroundColor Green
Write-Host "🌐 Frontend will be available at: http://localhost:8081" -ForegroundColor Cyan
Write-Host "📱 You can also use Expo Go app with the QR code" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

npm run web 