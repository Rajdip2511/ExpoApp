# Real-Time Event Check-In App - Server Startup Script
# This script starts the ONLY server you need: full-working-server.ts
# Run this after restarting your system to get PostgreSQL working

Write-Host "🚀 Starting Real-Time Event Check-In Backend Server" -ForegroundColor Green
Write-Host "📋 Server: full-working-server.ts (100% Complete)" -ForegroundColor Cyan
Write-Host "🗄️  Database: PostgreSQL + Prisma" -ForegroundColor Yellow
Write-Host "🔐 Auth: JWT Static Tokens" -ForegroundColor Magenta
Write-Host ""

# Change to backend directory
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file missing - creating it..." -ForegroundColor Red
    @"
DATABASE_URL=postgresql://postgres:9836280158@localhost:5432/nativeexpo
JWT_SECRET=your-super-secret-jwt-key-for-event-checkin-app-2024
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Stop any existing node processes
Write-Host "🛑 Stopping existing node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start the full working server
Write-Host "🎯 Starting full-working-server.ts..." -ForegroundColor Green
Write-Host "📡 Backend will be available at: http://localhost:4000" -ForegroundColor Cyan
Write-Host "🔍 GraphQL endpoint: http://localhost:4000/graphql" -ForegroundColor Cyan
Write-Host "💚 Health check: http://localhost:4000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

npx ts-node src/full-working-server.ts 