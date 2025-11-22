# Localist Deployment Guide

**Complete Production Deployment Guide for Backend + Frontend**

---

## 📋 Table of Contents

1. [Backend Deployment (Railway.app)](#backend-deployment)
2. [Frontend Deployment (Expo EAS)](#frontend-deployment)
3. [Database Setup (PostgreSQL + PostGIS)](#database-setup)
4. [Image Storage (Cloudflare R2)](#image-storage)
5. [WebSocket Configuration](#websocket)
6. [Push Notifications](#push-notifications)
7. [Environment Variables](#environment-variables)
8. [CI/CD Pipeline](#cicd)

---

## 🚀 Backend Deployment (Railway.app)

### Step 1: Prepare Backend

```bash
cd backend

# Create requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
geoalchemy2==0.14.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
websockets==12.0
boto3==1.29.7
Pillow==10.1.0
numpy==1.26.2
pydantic==2.5.0
pydantic-settings==2.1.0
EOF

# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Create runtime.txt (specify Python version)
echo "python-3.11.6" > runtime.txt
```

### Step 2: Deploy to Railway

1. **Sign up**: Visit [railway.app](https://railway.app)

2. **Create New Project**:
   ```
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your localist repository
   - Select /backend directory as root
   ```

3. **Add PostgreSQL**:
   ```
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create DATABASE_URL
   ```

4. **Set Environment Variables** (see [Environment Variables](#environment-variables))

5. **Deploy**:
   ```
   - Railway auto-deploys on git push
   - Watch logs in Railway dashboard
   ```

6. **Get Your URL**:
   ```
   - Go to Settings → Domains
   - Generate domain: your-app.up.railway.app
   - (Optional) Add custom domain
   ```

### Step 3: Initialize Database

```bash
# SSH into Railway (or use Railway CLI)
railway run python

# In Python shell:
from database import init_db
init_db()
exit()
```

### Alternative: Render.com

1. **Create Web Service**:
   - Connect GitHub repo
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Add PostgreSQL**:
   - Create PostgreSQL database
   - Copy DATABASE_URL to environment variables

---

## 📱 Frontend Deployment (Expo EAS)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli

# Login to Expo
eas login
```

### Step 2: Configure EAS

```bash
cd frontend

# Initialize EAS
eas build:configure

# This creates eas.json:
```

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 3: Update app.json

```json
{
  "expo": {
    "name": "Localist",
    "slug": "localist",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "localist",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#667eea"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.localist.app",
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      },
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Localist uses your location to discover nearby local businesses.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Localist uses your location to discover nearby local businesses."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#667eea"
      },
      "package": "com.localist.app",
      "versionCode": 1,
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "NOTIFICATIONS"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### Step 4: Build for iOS (TestFlight)

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store Connect (for TestFlight)
eas submit --platform ios

# You'll need:
# - Apple Developer Account ($99/year)
# - App Store Connect API Key
```

### Step 5: Build for Android (Play Store Beta)

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play Console
eas submit --platform android

# You'll need:
# - Google Play Developer Account ($25 one-time)
# - Google Service Account JSON key
```

### Step 6: Over-the-Air (OTA) Updates

```bash
# Publish update without rebuilding
eas update --branch production --message "Bug fixes and improvements"

# Users get updates automatically!
```

---

## 🗄️ Database Setup (PostgreSQL + PostGIS)

### Railway PostgreSQL

Railway automatically provisions PostgreSQL. To add PostGIS:

```bash
# Connect to Railway PostgreSQL
railway run psql $DATABASE_URL

# Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# Verify
SELECT PostGIS_version();
```

### Manual PostgreSQL Setup

```bash
# Install PostgreSQL 15
sudo apt-get install postgresql-15 postgresql-15-postgis-3

# Create database
sudo -u postgres createdb localist

# Enable PostGIS
sudo -u postgres psql localist
CREATE EXTENSION postgis;
```

### Database Migrations

```bash
# Using Alembic (recommended)
pip install alembic

# Initialize
alembic init migrations

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

---

## 📦 Image Storage (Cloudflare R2)

### Step 1: Create R2 Bucket

1. **Go to Cloudflare Dashboard** → R2
2. **Create Bucket**: `localist-images`
3. **Set Public Access** (if needed)

### Step 2: Get API Credentials

1. **R2 → Manage R2 API Tokens**
2. **Create API Token**:
   - Permissions: Edit
   - Bucket: localist-images
3. **Copy**:
   - Account ID
   - Access Key ID
   - Secret Access Key

### Step 3: Configure Custom Domain (Optional)

1. **R2 Bucket → Settings → Domain**
2. **Add Custom Domain**: `images.localist.app`
3. **Update DNS** (Cloudflare auto-configures if domain is on Cloudflare)

### Step 4: Set Environment Variables

```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=localist-images
R2_PUBLIC_URL=https://images.localist.app
```

### Alternative: AWS S3

Update `backend/image_upload.py`:

```python
s3_client = boto3.client(
    's3',
    region_name='us-east-1',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)
```

---

## 🔌 WebSocket Configuration

### Railway WebSocket Support

Railway supports WebSockets out of the box! Just:

1. **Ensure FastAPI WebSocket route is configured**:

```python
# backend/main.py
from fastapi import WebSocket
from .websocket import websocket_endpoint

@app.websocket("/ws/messages")
async def websocket_route(websocket: WebSocket, token: str):
    await websocket_endpoint(websocket, token)
```

2. **Client connects to**: `wss://your-app.up.railway.app/ws/messages?token=...`

### Nginx Configuration (Self-Hosted)

```nginx
server {
    listen 443 ssl;
    server_name api.localist.app;

    # WebSocket upgrade
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Regular HTTP
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```

---

## 🔔 Push Notifications

### Step 1: Configure Expo Notifications

```bash
cd frontend
expo install expo-notifications expo-device expo-constants
```

### Step 2: Add Notification Permissions (app.json)

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#667eea",
      "androidMode": "default",
      "androidCollapsedTitle": "New message from {{businessName}}"
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "permissions": ["NOTIFICATIONS"],
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### Step 3: Request Permissions (Frontend)

```javascript
// services/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  })).data;

  return token;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Step 4: Send Notifications (Backend)

```python
# backend/notifications.py
import requests

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def send_push_notification(expo_token: str, title: str, body: str, data: dict = None):
    """Send push notification via Expo Push API."""
    message = {
        "to": expo_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {},
    }

    response = requests.post(EXPO_PUSH_URL, json=message)
    return response.json()

# Usage:
send_push_notification(
    expo_token="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    title="New Message",
    body="Sarah sent you a message",
    data={"type": "message", "conversation_id": 123}
)
```

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/localist

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=localist-images
R2_PUBLIC_URL=https://images.localist.app

# CORS (comma-separated origins)
ALLOWED_ORIGINS=https://localist.app,https://www.localist.app

# Environment
ENVIRONMENT=production
```

### Frontend (.env)

```bash
# API
API_URL=https://api.localist.app
WS_URL=wss://api.localist.app

# Google Maps
GOOGLE_MAPS_API_KEY_IOS=your-ios-key
GOOGLE_MAPS_API_KEY_ANDROID=your-android-key

# Expo
EXPO_PROJECT_ID=your-expo-project-id
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up --service backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Publish OTA Update
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        run: |
          cd frontend
          npm install -g eas-cli
          eas update --branch production --non-interactive
```

---

## ✅ Pre-Launch Checklist

### Backend

- [ ] Environment variables set
- [ ] Database initialized with PostGIS
- [ ] HTTPS/SSL enabled
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] Error logging (Sentry)
- [ ] Health check endpoint working
- [ ] WebSocket tested
- [ ] Image upload tested

### Frontend

- [ ] API_URL points to production
- [ ] Google Maps API keys set
- [ ] App icons/splash screens added
- [ ] Privacy policy added
- [ ] Terms of service added
- [ ] App Store screenshots prepared
- [ ] TestFlight/Play Store beta tested
- [ ] Push notifications working
- [ ] Crash reporting (Sentry)

### App Store Submission

- [ ] Apple Developer account
- [ ] App Store Connect listing
- [ ] Screenshots (5.5", 6.5" iPhone + iPad)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating

### Google Play Submission

- [ ] Google Play Developer account
- [ ] Store listing
- [ ] Screenshots (phone + tablet)
- [ ] Feature graphic
- [ ] Privacy policy URL
- [ ] Content rating

---

## 📊 Monitoring & Analytics

### Recommended Tools

**Backend**:
- **Sentry**: Error tracking
- **LogTail**: Log aggregation
- **UptimeRobot**: Uptime monitoring

**Frontend**:
- **Expo Analytics**: Built-in
- **Sentry**: Crash reporting
- **Mixpanel/Amplitude**: User analytics

**Database**:
- **Railway Metrics**: Built-in
- **pgAdmin**: Database management

---

## 🚀 Launch Day!

1. **Deploy backend** to production
2. **Submit iOS build** to App Store Review
3. **Submit Android build** to Play Store Review
4. **Enable OTA updates** for quick fixes
5. **Monitor** logs and errors
6. **Gather feedback** from beta testers
7. **Iterate** and improve!

---

**Your app is ready for production! 🎉**

Questions? Check the troubleshooting guide or open an issue on GitHub.
