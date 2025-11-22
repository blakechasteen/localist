# Localist - Quick Start (2 Minutes)

## 🚀 Get the MVP Running Now

### Step 1: Get Google Maps API Key (30 seconds)

1. Visit: https://console.cloud.google.com/
2. Create project → Enable "Maps SDK" → Create API Key
3. Copy the key (starts with `AIza...`)

### Step 2: Configure Frontend (30 seconds)

Edit `frontend/app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "PASTE_YOUR_KEY_HERE"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "PASTE_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Step 3: Start Backend (30 seconds)

```bash
cd backend
pip install fastapi uvicorn
uvicorn main:app --reload
```

### Step 4: Start Frontend (30 seconds)

```bash
cd frontend
npm install  # or: expo install
expo start
```

Press `i` (iOS) or `a` (Android)

---

## ✅ You Should See:

1. **Map with your location** (blue dot)
2. **5 test businesses** (markers)
3. **Search bar** at top
4. **Map/List toggle** buttons

---

## 🎯 Try These Features:

**Patron (Customer) Mode:**
- Search: "artisan coffee"
- Toggle: Map ↔ List view
- Tap: Business marker

**Vendor (Business) Mode:**
- Navigate to: `VendorDashboardScreen`
- View: Analytics, Bulletin, Products
- Post: Weekly bulletin update

---

## 🐛 Troubleshooting:

**Map doesn't load?**
→ Check API key in `app.json`

**Can't connect to backend?**
→ Backend running? Visit: http://localhost:8000/health

**Location permission denied?**
→ Allow location access when prompted

---

## 📂 Project Structure:

```
localist/
├── backend/
│   ├── main.py                    # FastAPI app + HoloLoom
│   ├── database.py                # SQLAlchemy models
│   └── api/
│       └── businesses.py          # Business signup API
├── frontend/
│   ├── App.js                     # Main app (original)
│   ├── app.json                   # Expo config (API keys here!)
│   └── screens/
│       ├── PatronHomeScreen.js    # Customer discovery UI
│       └── VendorDashboardScreen.js  # Business dashboard
└── docs/
    ├── README.md                  # Project overview
    ├── MVP_SETUP_GUIDE.md         # Complete setup guide
    └── QUICK_START.md             # This file
```

---

## 🎨 UI/UX Files:

### Patron (Customer) Screens:
- ✅ **PatronHomeScreen.js** - Map discovery + search
- ⏳ BusinessDetailScreen.js - Business profile
- ⏳ PatronMessagesScreen.js - Chat with vendors
- ⏳ PatronProfileScreen.js - Favorites & history

### Vendor (Business) Screens:
- ✅ **VendorDashboardScreen.js** - Analytics + bulletin + products
- ⏳ VendorSignupScreen.js - Business onboarding
- ⏳ VendorMessagesScreen.js - Customer chat
- ⏳ VendorSettingsScreen.js - Business settings

---

## 🔥 What's Working Right Now:

### Backend (FastAPI + HoloLoom):
- [x] Semantic search ("artisan coffee" finds coffee shops)
- [x] Business listing API
- [x] Recommendations API
- [x] Health check endpoint
- [x] CORS enabled for React Native
- [x] 5 test businesses seeded

### Frontend (React Native + Expo):
- [x] Google Maps integration
- [x] Location detection
- [x] Business markers on map
- [x] Semantic search bar
- [x] Map/List toggle
- [x] Business cards with confidence scores
- [x] Radius filtering (5/10/25 miles)
- [x] Vendor dashboard with 4 tabs
- [x] Bulletin board posting
- [x] Product management UI
- [x] Analytics view

---

## 📱 Next Features to Build:

1. **Business Detail Screen** (1-2 days)
   - Photos, description, hours
   - Reviews display
   - Message/directions buttons

2. **Messaging** (2-3 days)
   - Real-time chat (WebSocket)
   - Notifications
   - Conversation history

3. **Reviews** (2-3 days)
   - Purchase marking
   - Seller confirmation
   - Review submission

4. **Vendor Signup** (2-3 days)
   - Business info form
   - Tax ID verification
   - Location picker

---

## 🎯 Success Metrics:

**You're ready for beta when:**
- [ ] 10+ businesses can sign up
- [ ] Customers can search and find them
- [ ] Messaging works end-to-end
- [ ] Reviews are verified
- [ ] App deployed to TestFlight/Play Store

---

**Need more details?** See `MVP_SETUP_GUIDE.md`

**Ready to build!** 🚀
