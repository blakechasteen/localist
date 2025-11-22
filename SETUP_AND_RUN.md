# Localist - Local Development Setup

Complete guide to set up and run Localist locally for development and testing.

---

## 📋 Prerequisites

### Required Software
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** with PostGIS extension - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads/)

### Optional but Recommended
- **Docker** (for PostgreSQL) - [Download](https://www.docker.com/products/docker-desktop/)
- **Expo Go app** (for mobile testing) - Install from App Store or Play Store
- **Physical iOS/Android device** (required for push notifications)

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/blakechasteen/localist.git
cd localist
```

### 2. Set Up Backend
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 3. Set Up Database

**Option A: Using Docker (Recommended)**
```bash
# Run PostgreSQL with PostGIS in Docker
docker run -d \
  --name localist-db \
  -e POSTGRES_USER=localist \
  -e POSTGRES_PASSWORD=dev_pass \
  -e POSTGRES_DB=localist \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Wait 5 seconds for database to start
sleep 5

# Run migrations
python migrations/001_add_push_notifications.py
```

**Option B: Using Local PostgreSQL**
```bash
# Create database
createdb localist

# Enable PostGIS extension
psql localist -c "CREATE EXTENSION postgis;"

# Create user
psql localist -c "CREATE USER localist WITH PASSWORD 'dev_pass';"
psql localist -c "GRANT ALL PRIVILEGES ON DATABASE localist TO localist;"

# Run migrations
python migrations/001_add_push_notifications.py
```

### 4. Configure Environment Variables
```bash
# Create .env file in backend directory
cat > backend/.env << EOF
DATABASE_URL=postgresql://localist:dev_pass@localhost:5432/localist
JWT_SECRET_KEY=your-super-secret-key-change-in-production
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=localist-images
EOF
```

### 5. Start Backend Server
```bash
# From backend directory
cd backend
python main.py

# Or with uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend should now be running at:**
- 🌐 API: http://localhost:8000
- 📖 Docs: http://localhost:8000/docs
- 📡 WebSocket: ws://localhost:8000/ws/messages

### 6. Set Up Frontend
```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start Expo development server
npm start
```

**Frontend options:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

---

## 📱 Testing Push Notifications

**IMPORTANT**: Push notifications only work on physical devices (not simulators/emulators).

### 1. Build Development Version
```bash
cd frontend
npx expo start
```

### 2. Install on Physical Device
- **iOS**: Scan QR code with Camera app → Opens in Expo Go
- **Android**: Scan QR code with Expo Go app

### 3. Grant Notification Permissions
- App will request permissions on first launch
- Grant "Allow Notifications"
- Push token automatically registered with backend

### 4. Test Notification
```bash
# Get access token (login first)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "user_type": "patron"
  }'

# Send test notification
curl -X POST http://localhost:8000/api/notifications/test \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Hello from Localist!"
  }'
```

Check your device - notification should appear!

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Testing
1. Start backend server
2. Start frontend on physical device
3. Test user flows:
   - Register new account
   - Login
   - Send message (test WebSocket)
   - Close app and send message (test push notification)
   - Open notification (test deep linking)

---

## 🔧 Development Workflow

### Daily Development
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Database (if needed)
psql localist
```

### Making Code Changes

**Backend Changes:**
- Edit files in `backend/`
- Server auto-reloads (with `--reload` flag)
- Check logs in Terminal 1

**Frontend Changes:**
- Edit files in `frontend/`
- Shake device and select "Reload"
- Or enable "Fast Refresh" for automatic updates

**Database Changes:**
1. Update models in `backend/database.py`
2. Create migration script in `backend/migrations/`
3. Run migration: `python migrations/002_your_migration.py`

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature-name
```

---

## 📊 Monitoring & Debugging

### Check Backend Logs
```bash
# Backend terminal shows:
# - API requests
# - WebSocket connections
# - Push notification sends
# - Database queries (with echo=True)
```

### Check Frontend Logs
```bash
# In Expo terminal, press 'j' to open debugger
# Or shake device → "Debug Remote JS"
# Chrome DevTools will open
```

### Database Inspection
```bash
# Connect to database
psql localist

# Check users table
SELECT id, email, expo_push_token, notifications_messages FROM users;

# Check messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

# Check WebSocket connections (in backend logs)
# Look for: "✅ User {id} connected"
```

### API Testing with curl
```bash
# Health check
curl http://localhost:8000/health

# Search businesses
curl "http://localhost:8000/api/search?query=coffee"

# WebSocket test (use wscat)
npm install -g wscat
wscat -c "ws://localhost:8000/ws/messages?token=<access_token>"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'backend'"
**Solution:**
```bash
# Make sure you're in the correct directory
cd backend
python main.py

# Or add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Issue 2: "sqlalchemy.exc.OperationalError: could not connect to server"
**Solution:**
```bash
# Check if PostgreSQL is running
docker ps  # If using Docker
pg_isready  # If using local PostgreSQL

# Restart database
docker restart localist-db  # If using Docker
```

### Issue 3: "expo_push_token column does not exist"
**Solution:**
```bash
# Run database migration
cd backend
python migrations/001_add_push_notifications.py
```

### Issue 4: Push notifications not working
**Solution:**
- Ensure you're using a **physical device** (not simulator)
- Check notification permissions in device settings
- Verify push token is registered: Check backend logs for "✅ Registered push token"
- Test with Expo push notification tool: https://expo.dev/notifications

### Issue 5: "Failed to fetch" errors in frontend
**Solution:**
```bash
# Update API_URL in frontend/services/api.js
# For physical device, use your computer's local IP (not localhost)

# Find your IP:
# Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows: ipconfig | findstr IPv4
# Linux: ip addr show | grep "inet " | grep -v 127.0.0.1

# Example: export const API_URL = 'http://192.168.1.100:8000';
```

### Issue 6: HoloLoom not found
**Solution:**
```bash
# HoloLoom is in separate mythRL repository
# Clone it as sibling to localist:
cd ..
git clone https://github.com/blakechasteen/mythRL.git

# Directory structure should be:
# ├── localist/
# └── mythRL/

# Or comment out HoloLoom in backend/main.py for testing
```

---

## 📦 Installing New Dependencies

### Backend (Python)
```bash
cd backend
pip install <package-name>
pip freeze > requirements.txt  # Update requirements
```

### Frontend (JavaScript)
```bash
cd frontend
npm install <package-name>
# package.json is automatically updated
```

---

## 🔒 Environment Variables Reference

### Backend (.env file)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET_KEY=your-secret-key-minimum-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Cloudflare R2 (for image uploads)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=localist-images

# Optional: CORS (default allows all for development)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend (app.json)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.100:8000",
      "wsUrl": "ws://192.168.1.100:8000"
    }
  }
}
```

---

## 🎯 Next Steps

Once everything is running locally:

1. **Test Core Features:**
   - [ ] User registration and login
   - [ ] Business search
   - [ ] Real-time messaging (WebSocket)
   - [ ] Push notifications (on physical device)
   - [ ] Image uploads

2. **Build Custom Features:**
   - Review `MVP_ROADMAP.md` for feature priorities
   - Check `PROJECT_STATUS.md` for current progress
   - Read `DEPLOYMENT_GUIDE.md` when ready to deploy

3. **Prepare for Production:**
   - Set up Cloudflare R2 for image storage
   - Configure production database (Railway, Render, etc.)
   - Build production mobile apps with EAS Build
   - Submit to App Store and Google Play

---

## 📚 Additional Resources

- **Project Documentation**: See `README.md`
- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Push Notifications**: `PUSH_NOTIFICATIONS_COMPLETE.md`
- **Backend Integration**: `BACKEND_INTEGRATION_COMPLETE.md`

---

**Need help?** Check the docs or create an issue on GitHub.

**Happy coding! 🚀**
