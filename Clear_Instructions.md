# 🚀 CLEAR INSTRUCTIONS - Complete Local Setup Guide

## ⚠️ IMPORTANT NOTICE
This guide provides **100% working step-by-step instructions** to set up and run this Real-Time Event Check-In App on your local machine after cloning from GitHub. Follow these instructions **EXACTLY** as written.

---

## 📋 PREREQUISITES (Install These First)

Before starting, you MUST have these installed on your system:

### 1. **Node.js & npm**
- Download and install **Node.js 18 or higher** from: https://nodejs.org/
- Verify installation:
  ```bash
  node --version   # Should show v18.x.x or higher
  npm --version    # Should show 8.x.x or higher
  ```

### 2. **Docker Desktop**
- Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/
- **Start Docker Desktop** and make sure it's running
- Verify installation:
  ```bash
  docker --version        # Should show Docker version
  docker-compose --version # Should show compose version
  ```

### 3. **Expo CLI or Expo Go App**
- **Option A (Recommended)**: Install Expo Go app on your phone
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
  - iOS: https://apps.apple.com/app/expo-go/id982107779
- **Option B**: Install Expo CLI globally
  ```bash
  npm install -g @expo/cli
  ```

### 4. **Git** (if not already installed)
- Download from: https://git-scm.com/downloads

---

## 🔧 STEP-BY-STEP SETUP INSTRUCTIONS

### Step 1: Clone the Repository
```bash
git clone https://github.com/Rajdip2511/ExpoApp.git
cd NativeExpo
```

### Step 2: Install All Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../mobile-app
npm install

# Go back to root directory
cd ..
```

### Step 3: Setup Database with Docker
```bash
# Start PostgreSQL database (this will download the image first time)
docker-compose up -d postgres

# Wait 10-15 seconds for database to fully start, then verify it's running
docker ps
```
**You should see a container named `event-checkin-postgres` running**

### Step 4: Configure Backend Environment
```bash
cd backend

# Create .env file from example
cp env.example .env
```

**IMPORTANT**: Open the `.env` file and update the DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/event_checkin_db?schema=public"
```
*Note: The password is "password" as set in docker-compose.yml*

### Step 5: Setup Database Schema and Seed Data
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database with demo data
npx prisma db seed
```

### Step 6: Start the Backend Server
```bash
# From backend directory
npm run dev
```

**✅ SUCCESS CHECK**: You should see:
```
🚀 Server ready at http://localhost:4000/graphql
🔌 Socket.io server running on port 4000
```

**Keep this terminal window open and running**

### Step 7: Start the Frontend (Mobile App)
Open a **NEW terminal window/tab** and run:
```bash
cd mobile-app
npm start
```

**✅ SUCCESS CHECK**: You should see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Step 8: Run the App on Your Device

#### **Option A: Phone with Expo Go (Recommended)**
1. Open Expo Go app on your phone
2. Scan the QR code displayed in terminal
3. App will load on your phone

#### **Option B: Web Browser**
Press `w` in the terminal to open in your web browser

#### **Option C: Android/iOS Simulator**
- Press `a` for Android emulator (requires Android Studio)
- Press `i` for iOS simulator (requires Xcode - Mac only)

---

## 🎯 VERIFICATION - App Should Be Working

### 1. **Backend Verification**
- Open http://localhost:4000/graphql in your browser
- You should see GraphQL Playground

### 2. **Frontend Verification**
- App opens with beautiful token selection screen
- Choose any demo user (e.g., "Demo User" with token `demo-token-123`)
- You should see the Events List screen with sample events
- Try joining an event - attendee count should update in real-time

### 3. **Real-time Features Test**
- Open the app on two devices (or web + phone)
- Join/leave events on one device
- Watch real-time updates on the other device

---

## 🐛 TROUBLESHOOTING

### Problem: Database Connection Error
**Solution**: Make sure Docker is running and PostgreSQL container is up
```bash
docker-compose down
docker-compose up -d postgres
# Wait 15 seconds, then restart backend
```

### Problem: "Expo Go not installed" 
**Solution**: Install Expo Go app from App Store/Play Store

### Problem: Network Error in App
**Solution**: Make sure your phone and computer are on the same WiFi network

### Problem: Backend won't start
**Solution**: 
1. Check if port 4000 is already in use
2. Make sure `.env` file exists in backend directory
3. Verify database is running with `docker ps`

### Problem: GraphQL errors
**Solution**: Run database setup again:
```bash
cd backend
npx prisma db push
npx prisma db seed
```

### Problem: App crashes on startup
**Solution**: Clear Metro cache:
```bash
cd mobile-app
npx expo start --clear
```

---

## 📱 DEMO USERS & TOKENS

The app uses static JWT tokens for demo purposes. Use any of these:

| User | Token | Role |
|------|-------|------|
| Demo User | `demo-token-123` | Demo Account |
| John Smith | `john-token-456` | Developer |
| Jane Doe | `jane-token-789` | Designer |
| Alice Johnson | `alice-token-101` | Product Manager |
| Bob Wilson | `bob-token-202` | QA Engineer |

---

## 🎉 WHAT YOU'LL SEE

### Features Working:
- ✅ Real-time event updates
- ✅ Join/leave events with live attendee counts
- ✅ Beautiful mobile UI with Material Design
- ✅ Socket.io real-time notifications
- ✅ GraphQL API with live data
- ✅ Create new events
- ✅ Event detail screens with live viewer counts

### Sample Data Includes:
- 5 demo users with different roles
- 6 sample events with various dates and locations
- Realistic attendee relationships

---

## 📞 SUPPORT

If you encounter any issues:

1. **Double-check prerequisites** - Make sure Node.js 18+, Docker, and Expo Go are properly installed
2. **Follow steps exactly** - Don't skip any steps or change commands
3. **Check troubleshooting section** above
4. **Verify ports** - Make sure ports 4000 (backend) and 8081 (expo) are available

### 🤖 RUNNING WITH CURSOR AI (FREE VERSION) - 100% WORKING GUIDE

#### Step 1: Download and Install Cursor AI
1. Go to: https://cursor.sh/
2. Download Cursor for your OS (Windows/Mac/Linux)
3. Install and open Cursor AI

#### Step 2: Open Project in Cursor
1. **File** → **Open Folder**
2. Select your cloned `NativeExpo` project folder
3. Cursor will automatically detect it's a TypeScript/React Native project

#### Step 3: Setup Cursor Workspace (FREE VERSION COMPATIBLE)
1. **Accept workspace recommendations** when Cursor prompts
2. **Install recommended extensions** (TypeScript, React Native, etc.)
3. **Do NOT** enable Copilot++ or paid features (free version works perfectly)

#### Step 4: Configure Cursor for This Project
1. Open **Command Palette** (`Ctrl/Cmd + Shift + P`)
2. Type: `TypeScript: Select TypeScript Version`
3. Select: `Use Workspace Version` (uses project's TypeScript)

#### Step 5: Setup Integrated Terminal
1. Open integrated terminal (`Ctrl/Cmd + ~`)
2. **Split terminal** for backend and frontend:
   - Click the split terminal icon (+) 
   - You'll have 2 terminal panes

#### Step 6: Run Backend in Terminal 1
```bash
# In first terminal pane
cd backend
npm run dev
```

#### Step 7: Run Frontend in Terminal 2  
```bash
# In second terminal pane  
cd mobile-app
npm start
```

#### Step 8: Use Cursor AI Features (FREE VERSION)
- **Code completion**: Works automatically (no setup needed)
- **AI chat**: Use `Ctrl/Cmd + L` for AI assistance
- **Code explanation**: Select code → right-click → "Explain with AI"
- **Error fixing**: Click on red error squiggles for AI suggestions

#### ⚠️ FREE VERSION LIMITATIONS & WORKAROUNDS:
1. **Limited AI requests**: 
   - **Solution**: Use AI chat sparingly, focus on critical errors only
   
2. **No advanced Copilot features**:
   - **Solution**: Basic autocomplete still works perfectly
   
3. **Rate limiting**:
   - **Solution**: If you hit limits, continue coding normally, AI will reset

#### 🔧 CURSOR-SPECIFIC TROUBLESHOOTING:

**Problem**: TypeScript errors in Cursor but code works
**Solution**: 
```bash
# In terminal
npx tsc --noEmit
# If no errors, it's just Cursor's display issue
```

**Problem**: Cursor can't find Node modules
**Solution**:
1. `Ctrl/Cmd + Shift + P`
2. Type: `Developer: Reload Window`
3. Or restart Cursor entirely

**Problem**: AI features not working
**Solution**:
1. Check internet connection
2. Sign in to Cursor account (free signup)
3. Restart Cursor if needed

**Problem**: Terminal not opening
**Solution**:
1. `View` → `Terminal` from menu
2. Or use `Ctrl/Cmd + ~`

**Problem**: Project not recognized as React Native
**Solution**:
1. Open `mobile-app/package.json` first
2. Cursor will auto-detect React Native setup

#### 🎯 CURSOR AI WORKFLOW FOR THIS PROJECT:

1. **Use split-pane editing**:
   - Left: Backend files (`backend/src/`)
   - Right: Frontend files (`mobile-app/src/`)

2. **Leverage AI for debugging**:
   - Select error → `Ctrl/Cmd + L` → ask "Fix this error"
   - Paste error logs in AI chat for solutions

3. **Smart code navigation**:
   - `Ctrl/Cmd + P` - Quick file open
   - `Ctrl/Cmd + Shift + F` - Search across all files
   - `F12` - Go to definition

4. **Use terminal efficiently**:
   - Keep backend running in terminal 1
   - Keep frontend running in terminal 2
   - Use `Ctrl/Cmd + C` to stop servers when needed

#### ✅ VERIFICATION IN CURSOR:
- **No red underlines** in main files
- **Terminal shows green success messages**
- **AI chat responds** when you ask questions
- **Code completion works** as you type

**🎉 Result**: You'll have a fully functional development environment with AI assistance for coding, debugging, and learning!

---

## 🔄 HOW TO RESTART EVERYTHING

If you need to restart the entire setup:

```bash
# Stop all services
docker-compose down
# Kill any running processes (Ctrl+C in terminals)

# Restart database
docker-compose up -d postgres

# Start backend (in backend directory)
npm run dev

# Start frontend (in mobile-app directory, new terminal)
npm start
```

---

**🎯 That's it! Your Real-Time Event Check-In App should now be running perfectly on your local machine.** 