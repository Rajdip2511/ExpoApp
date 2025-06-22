@echo off
echo 🚀 Starting Real-Time Event Check-In App Services
echo.

echo 📋 Setting up environment...
set DATABASE_URL=postgresql://postgres:9836280158@localhost:5432/event_checkin_db

echo.
echo 🗄️  Available Services:
echo    1. Prisma Studio (Database Browser) - http://localhost:5555
echo    2. Production Server (GraphQL API) - http://localhost:4000
echo    3. pgAdmin (Database Management) - http://localhost:8080
echo.

echo 🎯 Starting Prisma Studio...
start /B cmd /c "set DATABASE_URL=%DATABASE_URL% && npx prisma studio"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo 🚀 Starting Production Server...
start /B cmd /c "set DATABASE_URL=%DATABASE_URL% && npx ts-node src/production-server.ts"

echo.
echo ✅ Services are starting up!
echo.
echo 🌐 Access URLs:
echo    • Prisma Studio: http://localhost:5555
echo    • GraphQL API: http://localhost:4000/graphql
echo    • Health Check: http://localhost:4000/health
echo    • pgAdmin: http://localhost:8080
echo.
echo 📋 Database Info:
echo    • PostgreSQL: localhost:5432
echo    • Database: event_checkin_db
echo    • Schema: Exact compliance with requirements
echo.
echo 🔑 Authentication: JWT + Static Tokens
echo 📊 Data: 5 users, 6 events with relationships
echo.
pause 