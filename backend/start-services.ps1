Write-Host "🚀 Starting Real-Time Event Check-In App Services" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Setting up environment..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:9836280158@localhost:5432/event_checkin_db"

Write-Host ""
Write-Host "🗄️  Available Services:" -ForegroundColor Cyan
Write-Host "   1. Prisma Studio (Database Browser) - http://localhost:5555"
Write-Host "   2. Production Server (GraphQL API) - http://localhost:4000"
Write-Host "   3. pgAdmin (Database Management) - http://localhost:8080"
Write-Host ""

Write-Host "🎯 Starting Prisma Studio..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "`$env:DATABASE_URL='$env:DATABASE_URL'; npx prisma studio" -WindowStyle Hidden

Write-Host "⏳ Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "🚀 Starting Production Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "`$env:DATABASE_URL='$env:DATABASE_URL'; npx ts-node src/production-server.ts" -WindowStyle Hidden

Write-Host ""
Write-Host "✅ Services are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   • Prisma Studio: http://localhost:5555" -ForegroundColor White
Write-Host "   • GraphQL API: http://localhost:4000/graphql" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:4000/health" -ForegroundColor White
Write-Host "   • pgAdmin: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "📋 Database Info:" -ForegroundColor Cyan
Write-Host "   • PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "   • Database: event_checkin_db" -ForegroundColor White
Write-Host "   • Schema: Exact compliance with requirements" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Authentication: JWT + Static Tokens" -ForegroundColor Magenta
Write-Host "📊 Data: 5 users, 6 events with relationships" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
Read-Host 