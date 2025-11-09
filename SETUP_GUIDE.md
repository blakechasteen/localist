# Localist Development Setup Guide
**Complete guide to get Localist running locally**

---

## 🎯 What You're Building

A complete local business discovery platform with:
- **Backend**: FastAPI + HoloLoom AI (semantic search)
- **Frontend**: React Native mobile app (iOS + Android)
- **Database**: PostgreSQL + PostGIS (geospatial)
- **Landing Page**: Static HTML (email signups)

---

## 📋 Prerequisites

### Required Software:

1. **Python 3.10+**
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`

2. **Node.js 18+** (for React Native)
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

3. **Docker Desktop** (for PostgreSQL)
   - Download: https://www.docker.com/products/docker-desktop/
   - Verify: `docker --version`

4. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

5. **VS Code** (recommended editor)
   - Download: https://code.visualstudio.com/

6. **Expo CLI** (for React Native)
   - Install: `npm install -g expo-cli`
   - Verify: `expo --version`

### Optional:
- **Expo Go App** on your phone (iOS/Android) for testing
- **Android Studio** or **Xcode** for simulators

---

## 🚀 Step-by-Step Setup

### Step 1: Clone HoloLoom Repository

Localist uses HoloLoom for AI-powered semantic search.

```bash
# Navigate to your projects directory
cd ~/Projects  # or wherever you keep code

# Clone mythRL repo (contains HoloLoom)
git clone https://github.com/yourusername/mythRL.git
cd mythRL

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate  # Windows

# Install HoloLoom dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Test HoloLoom
python -c "from HoloLoom import HoloLoom; print('✅ HoloLoom ready!')"
```

**Expected output**: `✅ HoloLoom ready!`

---

### Step 2: Navigate to Localist Directory

```bash
# Localist should be in your Documents/localist folder
cd ~/OneDrive/Documents/localist  # Windows
# OR
cd ~/Documents/localist  # macOS/Linux
```

Your directory structure should look like:
```
localist/
├── backend/           # FastAPI backend
├── frontend/          # React Native app
├── landing-page/      # HTML landing page
├── README.md
├── BUSINESS_MODEL.md
├── MVP_ROADMAP.md
└── ... (other docs)
```

---

### Step 3: Set Up Backend

```bash
cd backend

# Create virtual environment (separate from HoloLoom)
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate  # Windows

# Install backend dependencies
pip install -r requirements.txt

# Set PYTHONPATH to include HoloLoom
export PYTHONPATH="../../mythRL:$PYTHONPATH"  # macOS/Linux
# OR
set PYTHONPATH=..\..\mythRL;%PYTHONPATH%  # Windows CMD
# OR
$env:PYTHONPATH="../../mythRL;$env:PYTHONPATH"  # Windows PowerShell
```

---

### Step 4: Start PostgreSQL Database

```bash
# Start PostgreSQL + PostGIS container
docker run -d \
  --name localist-db \
  -e POSTGRES_DB=localist \
  -e POSTGRES_USER=localist \
  -e POSTGRES_PASSWORD=dev_password_change_in_prod \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Verify it's running
docker ps

# Should see: localist-db ... Up ...
```

**Test database connection**:
```bash
# Connect to database
docker exec -it localist-db psql -U localist -d localist

# Inside psql:
CREATE EXTENSION postgis;
\q  # Exit
```

**Initialize database schema**:
```bash
# Run from backend/ directory
python database.py
```

**Expected output**:
```
✅ PostGIS extension enabled
✅ Database tables created
✅ Database ready!
```

---

### Step 5: Start Backend Server

```bash
# Make sure you're in backend/ directory
# Make sure virtual environment is activated
# Make sure PYTHONPATH includes HoloLoom

python main.py
```

**Expected output**:
```
🚀 Starting Localist API...
🧠 Initializing HoloLoom AI...
✅ Seeded 5 test businesses into HoloLoom
✅ HoloLoom ready!
✅ Localist API running on http://localhost:8000
📖 API docs: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Test the API**:

Open your browser:
- Main page: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Or use curl:
```bash
# Health check
curl http://localhost:8000/health

# Search for businesses
curl "http://localhost:8000/api/search?query=coffee"
```

**Expected response**:
```json
{
  "query": "coffee",
  "results": [
    {
      "content": "Business: Third Wave Coffee\nCategory: coffee_shop\n...",
      "confidence": 0.92
    }
  ],
  "total": 1
}
```

✅ **Backend is working!**

---

### Step 6: Set Up React Native Frontend

Open a **new terminal** (keep backend running in first terminal).

```bash
cd ~/Documents/localist/frontend

# Install dependencies
npm install

# Start Expo development server
npm start
```

**Expected output**:
```
› Metro waiting on exp://192.168.1.100:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

**Run on phone**:
1. Install **Expo Go** app (iOS/Android)
2. Scan QR code with phone camera
3. App should open in Expo Go

**Run on simulator**:
- Press `i` for iOS simulator (requires Xcode on macOS)
- Press `a` for Android emulator (requires Android Studio)

**First Time Setup**:
- You'll be prompted for location permission - **allow**
- App will load map centered on your location
- You should see "Localist" header and search bar

**Test search**:
1. Type "coffee" in search bar
2. Press search button (🔍)
3. You should see "Third Wave Coffee" in results

✅ **Frontend is working!**

---

### Step 7: Open Landing Page

```bash
cd ~/Documents/localist/landing-page

# Open in browser
open index.html  # macOS
# OR
start index.html  # Windows
# OR just double-click index.html in file explorer
```

**Test email signup**:
1. Enter email in form
2. Click "Join Waitlist"
3. You should see green success message
4. Email is saved to browser localStorage (for MVP)

✅ **Landing page is working!**

---

## 🧪 Testing the Full Stack

### Test 1: Semantic Search

**Backend (curl)**:
```bash
curl "http://localhost:8000/api/search?query=pottery+classes"
```

**Expected**: Should return "Pottery Paradise" business

**Frontend (mobile app)**:
1. Open app
2. Search "pottery classes"
3. Should see Pottery Paradise in results

### Test 2: Map Discovery

**Frontend only**:
1. Switch to "Map" view
2. You should see 5 markers (test businesses)
3. Tap a marker to see business name/category
4. Zoom in/out to explore

### Test 3: Geospatial Query

**Backend (curl)**:
```bash
curl "http://localhost:8000/api/search?query=all+businesses&lat=37.7749&lon=-122.4194&radius_miles=5"
```

**Expected**: Returns businesses within 5 miles of San Francisco

---

## 🐛 Troubleshooting

### "Module not found: HoloLoom"

**Problem**: Backend can't find HoloLoom

**Solution**:
```bash
# Make sure PYTHONPATH is set
export PYTHONPATH="../../mythRL:$PYTHONPATH"

# Or add to .env file:
echo "PYTHONPATH=../../mythRL" >> .env

# Verify HoloLoom is accessible
python -c "import HoloLoom; print('Found!')"
```

### "Cannot connect to database"

**Problem**: PostgreSQL not running

**Solution**:
```bash
# Check if container is running
docker ps

# If not, start it
docker start localist-db

# Check logs
docker logs localist-db
```

### "PostGIS extension error"

**Problem**: PostGIS extension not enabled

**Solution**:
```bash
# Connect to database
docker exec -it localist-db psql -U localist -d localist

# Create extension
CREATE EXTENSION postgis;

# Verify
SELECT PostGIS_Version();

\q
```

### "Expo app not loading"

**Problem**: Metro bundler can't connect

**Solution**:
```bash
# Make sure you're on same WiFi network (phone + computer)

# Try tunnel mode (slower but works through firewall)
expo start --tunnel

# Or use localhost (only works on simulator)
expo start --localhost
```

### "Search returns empty results"

**Problem**: HoloLoom not seeded with test data

**Solution**:
```bash
# Restart backend (will re-seed data)
# Press Ctrl+C to stop backend
python main.py

# Check seed output:
# ✅ Seeded 5 test businesses into HoloLoom
```

---

## 📦 Next Steps

Now that you have the full stack running:

### Add Your First Real Business

```bash
# Use the API to create a business
curl -X POST http://localhost:8000/api/businesses/signup \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "My Coffee Shop",
    "owner_email": "owner@example.com",
    "category": "coffee_shop",
    "description": "Best coffee in town",
    "address": "123 Main St, Asheville, NC",
    "tax_id": "XX-XXXXXXX",
    "phone": "555-1234"
  }'
```

### Test Business Verification

```bash
# Verify the business (admin action)
curl -X POST http://localhost:8000/api/businesses/1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": 1,
    "approved": true,
    "notes": "Verified via tax ID"
  }'
```

### Build Production Features

See [MVP_ROADMAP.md](MVP_ROADMAP.md) for:
- Week 3-4: Business profiles and bulletin board
- Week 5-6: Customer discovery and messaging
- Week 7-8: Reviews and recommendations
- Week 9-16: Polish, testing, beta launch

---

## 🚢 Deployment (Optional)

### Deploy Backend to Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Add environment variables
railway variables set DATABASE_URL=postgresql://...
railway variables set PYTHONPATH=/app/mythRL
```

### Deploy Frontend (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build for iOS and Android
eas build --platform all

# Submit to app stores
eas submit
```

---

## 📚 Additional Resources

### Documentation:
- [README.md](README.md) - Project overview
- [HOLOLOOM_INTEGRATION.md](HOLOLOOM_INTEGRATION.md) - AI integration details
- [MVP_ROADMAP.md](MVP_ROADMAP.md) - 12-week implementation plan
- [BUSINESS_MODEL.md](BUSINESS_MODEL.md) - Revenue model
- [backend/README.md](backend/README.md) - Backend API docs

### Tutorials:
- FastAPI: https://fastapi.tiangolo.com/tutorial/
- React Native: https://reactnative.dev/docs/getting-started
- Expo: https://docs.expo.dev/
- PostGIS: https://postgis.net/workshops/postgis-intro/

### Community:
- Create issues: https://github.com/yourusername/localist/issues
- Discussions: https://github.com/yourusername/localist/discussions

---

## ✅ Setup Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Docker Desktop installed
- [ ] mythRL (HoloLoom) cloned and dependencies installed
- [ ] Localist backend running on http://localhost:8000
- [ ] PostgreSQL container running
- [ ] Database initialized with schema
- [ ] React Native frontend running on phone/simulator
- [ ] Landing page opens in browser
- [ ] Can search for "coffee" and see results
- [ ] Can view businesses on map
- [ ] Ready to start building features! 🚀

---

**Congratulations! You have a working Localist development environment!** 🎉

Next: Start building MVP features from [MVP_ROADMAP.md](MVP_ROADMAP.md)
