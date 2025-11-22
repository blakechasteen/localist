# Localist MVP - Complete Setup Guide

**Getting the Map Working + UI/UX for Vendors & Patrons**

---

## 🎯 What You're Building

**Patron (Customer) Experience:**
- Map-based discovery of local businesses
- Semantic search ("artisan coffee", "pottery classes")
- Business profiles with reviews
- In-app messaging

**Vendor (Business) Experience:**
- Dashboard with analytics
- Weekly bulletin board posts
- Product/service management
- Customer messaging

---

## 📱 Quick Start (5 Minutes)

### 1. Get Google Maps API Key

**a) Create Google Cloud Project:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Localist-Dev"
3. Enable billing (free tier: 25K map loads/month)

**b) Enable APIs:**
```
- Maps SDK for Android
- Maps SDK for iOS
- Places API (for autocomplete later)
```

**c) Create API Key:**
1. APIs & Services → Credentials
2. Create Credentials → API Key
3. Copy key (starts with `AIza...`)

**d) Restrict Key (Optional but recommended):**
- Android: Add your app's package name + SHA-1 fingerprint
- iOS: Add your app's bundle identifier

---

### 2. Configure Frontend

**a) Update `app.json`:**

```json
{
  "expo": {
    "name": "Localist",
    "slug": "localist",
    "version": "0.1.0",
    "android": {
      "package": "com.localist.app",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY_HERE"
        }
      },
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    "ios": {
      "bundleIdentifier": "com.localist.app",
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY_HERE"
      }
    }
  }
}
```

**b) Install Dependencies:**

```bash
cd frontend

# Install all packages
npm install

# Or use Expo
expo install
```

---

### 3. Start Backend

**a) Install Python Dependencies:**

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install requirements
pip install fastapi uvicorn sqlalchemy psycopg2-binary geoalchemy2 python-jose[cryptography] passlib[bcrypt]
```

**b) Start FastAPI Server:**

```bash
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
🚀 Starting Localist API...
🧠 Initializing HoloLoom AI...
✅ HoloLoom ready!
✅ Localist API running on http://localhost:8000
📖 API docs: http://localhost:8000/docs
```

---

### 4. Start Frontend

**a) Start Expo:**

```bash
cd frontend
expo start
```

**b) Choose Platform:**

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app for physical device

**c) Test the Map:**

1. Grant location permissions when prompted
2. You should see:
   - Your blue dot on the map
   - 5 test businesses as markers
   - Search bar at top
   - Map/List toggle

---

## 🗺️ Testing the Map Features

### Test 1: Basic Map

```
1. Open app
2. Allow location access
3. See map centered on your location
4. See test business markers
```

### Test 2: Semantic Search

```
1. Type "artisan coffee" in search bar
2. Press search
3. Should find "Third Wave Coffee" (high confidence)
```

### Test 3: Radius Filter

```
1. Tap radius buttons (5mi, 10mi, 25mi)
2. Map should update with businesses in range
```

### Test 4: Map vs List View

```
1. Toggle between "Map" and "List" buttons
2. Map view: Shows markers
3. List view: Shows cards with business details
```

---

## 👥 UI/UX Architecture

### Patron (Customer) Screens

**1. PatronHomeScreen.js** ✅ Created
- Map-based discovery
- Semantic search
- Radius filtering
- Business cards with confidence scores

**2. BusinessDetailScreen.js** (To Build)
- Business photos
- Description & hours
- Products/services list
- Verified reviews
- Message button
- Directions button

**3. PatronMessagesScreen.js** (To Build)
- Conversations with businesses
- Real-time messaging
- Message history

**4. PatronProfileScreen.js** (To Build)
- Favorite businesses
- Visit history
- Reviews written
- Account settings

### Vendor (Business) Screens

**1. VendorDashboardScreen.js** ✅ Created
- **Overview Tab:**
  - Quick stats (views, messages, favorites)
  - Business status toggle (open/closed)
  - Quick actions
- **Bulletin Tab:**
  - Post weekly updates
  - Character counter (500 max)
  - Recent posts
- **Products Tab:**
  - Product list
  - Add/edit products
  - Stock status
- **Analytics Tab:**
  - Weekly performance
  - Top search terms
  - Customer insights

**2. VendorSignupScreen.js** (To Build)
- Business info form
- Tax ID verification upload
- Location picker
- Category selection

**3. VendorMessagesScreen.js** (To Build)
- Customer conversations
- Quick replies
- Notification management

**4. VendorSettingsScreen.js** (To Build)
- Business hours
- Contact info
- Photo gallery
- Payment settings

---

## 🎨 Design System

### Colors

```javascript
const colors = {
  primary: '#667eea',      // Purple (CTA buttons, active states)
  secondary: '#764ba2',    // Dark purple (gradients)
  success: '#10b981',      // Green (success messages)
  error: '#ef4444',        // Red (errors, warnings)
  warning: '#f59e0b',      // Amber (warnings)

  // Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};
```

### Typography

```javascript
const typography = {
  // Headers
  h1: { fontSize: 32, fontWeight: 'bold', color: colors.gray900 },
  h2: { fontSize: 28, fontWeight: 'bold', color: colors.gray900 },
  h3: { fontSize: 20, fontWeight: 'bold', color: colors.gray900 },

  // Body
  body: { fontSize: 16, color: colors.gray700 },
  bodySmall: { fontSize: 14, color: colors.gray600 },
  caption: { fontSize: 12, color: colors.gray500 },

  // Buttons
  button: { fontSize: 16, fontWeight: '600', color: 'white' },
};
```

### Spacing

```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Components

**Cards:**
```javascript
{
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
}
```

**Buttons (Primary):**
```javascript
{
  backgroundColor: '#667eea',
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
}
```

**Badges:**
```javascript
{
  backgroundColor: '#ede9fe',  // Light purple
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
}
```

---

## 🔌 API Integration

### Backend Endpoints (Already Implemented)

**Search:**
```
GET /api/search?query=artisan+coffee&lat=37.7749&lon=-122.4194&radius_miles=10
```

**List Businesses:**
```
GET /api/businesses?category=coffee_shop&limit=50
```

**Recommendations:**
```
GET /api/recommendations/{user_id}?lat=37.7749&lon=-122.4194
```

### Frontend API Client Pattern

```javascript
// utils/api.js
const API_URL = 'http://localhost:8000';

export async function searchBusinesses(query, lat, lon, radiusMiles = 10) {
  const url = `${API_URL}/api/search?query=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}&radius_miles=${radiusMiles}`;
  const response = await fetch(url);
  return response.json();
}

export async function listBusinesses(category, limit = 50) {
  const url = `${API_URL}/api/businesses?category=${category}&limit=${limit}`;
  const response = await fetch(url);
  return response.json();
}

export async function getRecommendations(userId, lat, lon) {
  const url = `${API_URL}/api/recommendations/${userId}?lat=${lat}&lon=${lon}`;
  const response = await fetch(url);
  return response.json();
}
```

---

## 🚀 Next Steps to Build

### Week 1-2: Core Patron Flow

- [ ] Business Detail Screen
  - Photo gallery
  - Full description
  - Products list
  - Reviews display
  - Message/Directions buttons

- [ ] Patron Profile Screen
  - Favorites list
  - Visit history
  - Settings

### Week 3-4: Core Vendor Flow

- [ ] Vendor Signup Flow
  - Business info form
  - Tax ID upload
  - Location picker (with map)
  - Category selection

- [ ] Vendor Settings Screen
  - Business hours editor
  - Photo gallery upload
  - Contact info management

### Week 5-6: Messaging

- [ ] Real-time messaging (WebSocket)
- [ ] Message notifications
- [ ] Conversation threads

### Week 7-8: Reviews & Verification

- [ ] Purchase marking flow
- [ ] Seller confirmation
- [ ] Review submission
- [ ] Review display with verified badge

---

## 🧪 Testing Checklist

### Map Functionality

- [ ] Map loads correctly
- [ ] User location detected
- [ ] Business markers display
- [ ] Marker tap shows business info
- [ ] Zoom/pan works smoothly

### Search Functionality

- [ ] Semantic search works ("artisan coffee" finds coffee shops)
- [ ] Results update on search
- [ ] Radius filter updates results
- [ ] Empty state shows when no results

### UI/UX

- [ ] Map/List toggle works
- [ ] Business cards display correctly
- [ ] Confidence scores show
- [ ] Loading states appear during API calls
- [ ] Error messages show on failures

### Vendor Dashboard

- [ ] Stats display correctly
- [ ] Open/closed toggle works
- [ ] Bulletin post submission works
- [ ] Product list displays
- [ ] Analytics show

---

## 📱 Device Testing

### iOS

```bash
# Simulator
expo start
# Press 'i'

# Physical device
# Scan QR code with Camera app
```

### Android

```bash
# Emulator
expo start
# Press 'a'

# Physical device
# Scan QR code with Expo Go app
```

---

## 🐛 Common Issues & Fixes

### Issue: Map doesn't load

**Fix:**
1. Check API key in `app.json`
2. Ensure billing enabled in Google Cloud
3. Restart Expo: `expo start -c` (clear cache)

### Issue: "Cannot connect to backend"

**Fix:**
1. Check backend is running: `http://localhost:8000/health`
2. Update API_URL for physical device:
   ```javascript
   const API_URL = 'http://YOUR_COMPUTER_IP:8000';
   // e.g., 'http://192.168.1.100:8000'
   ```

### Issue: Location permission denied

**Fix:**
1. iOS Simulator: Features → Location → Custom Location
2. Android Emulator: ... → Location → Set location
3. Physical device: Settings → App Permissions → Location

### Issue: HoloLoom not found

**Fix:**
```bash
# Set PYTHONPATH to include mythRL
export PYTHONPATH="/path/to/mythRL:$PYTHONPATH"

# Or add to backend/main.py:
import sys
sys.path.insert(0, '/path/to/mythRL')
```

---

## 🎯 MVP Feature Checklist

### Patron Features

- [x] Map-based discovery
- [x] Semantic search
- [x] Radius filtering
- [x] Business list view
- [ ] Business detail view
- [ ] In-app messaging
- [ ] Verified reviews
- [ ] Favorites

### Vendor Features

- [x] Dashboard overview
- [x] Bulletin board posts
- [x] Product management UI
- [x] Analytics view
- [ ] Business signup flow
- [ ] Photo upload
- [ ] Message responses
- [ ] Review management

### Backend Features

- [x] HoloLoom semantic search
- [x] Business listing API
- [x] Recommendations API
- [ ] Authentication (JWT)
- [ ] Database integration (PostgreSQL)
- [ ] Geospatial queries (PostGIS)
- [ ] Messaging (WebSocket)
- [ ] Review verification

---

## 📚 Resources

### Documentation

- [Expo Docs](https://docs.expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Google Maps Platform](https://developers.google.com/maps)

### Design Inspiration

- [Dribbble: Local Discovery](https://dribbble.com/search/local-discovery)
- [Behance: Map UI](https://www.behance.net/search/projects?search=map+ui)

---

## 🎉 Success Criteria

**You'll know the MVP is ready when:**

1. ✅ Map loads with user location
2. ✅ Semantic search finds businesses
3. ✅ Patron can browse businesses (map + list)
4. ✅ Vendor can post to bulletin board
5. ✅ Vendor can manage products
6. ⏳ Patron can message vendor
7. ⏳ Reviews work end-to-end
8. ⏳ 10+ test businesses in database
9. ⏳ App runs on iOS + Android
10. ⏳ Backend deployed (Railway/Render)

---

**Let's build the future of local commerce!** 🚀

**Questions? Check:**
- `README.md` - Project overview
- `HOLOLOOM_INTEGRATION.md` - AI features
- `MVP_ROADMAP.md` - Full development plan
