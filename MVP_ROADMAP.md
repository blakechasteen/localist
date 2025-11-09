# Localist MVP Roadmap
**From Concept to Launch in 12-16 Weeks**

---

## 🎯 MVP Definition

**Core Value Proposition**: Local business discovery within walking/driving distance with verified reviews

**Success Criteria**:
- 50+ businesses signed up in pilot city
- 500+ users actively discovering businesses
- 10+ verified purchases per week
- 75%+ user retention after 30 days

**What's IN the MVP**:
- ✅ Map-based business discovery (radius search)
- ✅ Business verification (Tax ID check)
- ✅ Semantic search ("artisan coffee" finds coffee roasters)
- ✅ Basic profiles (name, category, description, hours, photos)
- ✅ Weekly bulletin board (text updates)
- ✅ In-app messaging (user ↔ business)
- ✅ Verified reviews (purchase confirmation required)
- ✅ Basic personalized recommendations

**What's OUT of the MVP** (future phases):
- ❌ Payment processing (Phase 2)
- ❌ Live events (Phase 2)
- ❌ Advanced AI recommendations (Phase 2)
- ❌ Seller CRM (Phase 3)
- ❌ Loyalty programs (Phase 3)
- ❌ Multi-city expansion (Phase 4)

---

## 📅 Timeline: 12-16 Weeks

### Week 1-2: Foundation (Setup & Architecture)

**Goals**:
- Development environment ready
- Database schema designed
- Authentication working
- HoloLoom integrated

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Set up GitHub repo + CI/CD | Dev | 4h | ⏳ |
| Design database schema (PostgreSQL + PostGIS) | Dev | 8h | ⏳ |
| Set up FastAPI backend scaffolding | Dev | 8h | ⏳ |
| Integrate HoloLoom (semantic search + KG) | Dev | 12h | ⏳ |
| JWT authentication system | Dev | 6h | ⏳ |
| React Native app scaffolding | Dev | 8h | ⏳ |
| MapBox GL integration | Dev | 6h | ⏳ |

**Total**: ~52 hours (~1.5 weeks for 1 developer)

**Technical Decisions**:
```yaml
Backend:
  Framework: FastAPI (Python)
  Database: PostgreSQL 15 + PostGIS
  Graph: NetworkX (in-memory for MVP, Neo4j later)
  Vector: FAISS (embedded, Qdrant later)
  AI: HoloLoom (FAST mode)

Frontend:
  Framework: React Native (Expo)
  Map: MapBox GL (free tier)
  State: Redux Toolkit
  UI: React Native Paper

Hosting:
  Backend: Railway.app ($5/month)
  Database: Railway PostgreSQL ($10/month)
  CDN: Cloudflare (free)
  Total: ~$15/month during MVP
```

**Database Schema**:
```sql
-- Core tables for MVP

CREATE EXTENSION postgis;

-- Users (customers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Businesses (sellers)
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    tax_id_hash VARCHAR(64) NOT NULL,  -- Hashed for privacy
    verified BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    location GEOGRAPHY(POINT, 4326),  -- PostGIS point
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url TEXT,
    hours JSONB,  -- {"monday": "8am-5pm", ...}
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_business_location ON businesses USING GIST(location);
CREATE INDEX idx_business_category ON businesses(category);

-- Products (what businesses offer)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    in_stock BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bulletin board posts
CREATE TABLE bulletin_posts (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id),
    content TEXT NOT NULL,
    image_url TEXT,
    active_until TIMESTAMP,  -- Expires after 1 week
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulletin_active ON bulletin_posts(active_until)
    WHERE active_until > NOW();

-- Messages (user ↔ business)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES users(id),
    to_business_id INTEGER REFERENCES businesses(id),
    message_text TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews (verified only)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_id INTEGER REFERENCES businesses(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, business_id)  -- One review per user per business
);

-- Interactions (for Thompson Sampling)
CREATE TABLE user_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_id INTEGER REFERENCES businesses(id),
    interaction_type VARCHAR(50),  -- 'viewed', 'visited', 'purchased'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_business ON user_interactions(business_id);
```

---

### Week 3-4: Core Features (Business Side)

**Goals**:
- Businesses can sign up and verify
- Businesses can create profiles
- Businesses can post to bulletin board

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Business signup flow (web form) | Dev | 8h | ⏳ |
| Tax ID verification (manual for MVP) | Dev | 4h | ⏳ |
| Business profile creation/editing | Dev | 12h | ⏳ |
| Photo upload (Cloudflare R2 or S3) | Dev | 6h | ⏳ |
| Bulletin board post creation | Dev | 8h | ⏳ |
| HoloLoom ingestion (business → memory) | Dev | 6h | ⏳ |

**Total**: ~44 hours (~1 week for 1 developer)

**Business Signup Flow**:
```typescript
// React Native screens

1. Business Info Screen
   - Business name
   - Category (dropdown: coffee, food, retail, services, etc.)
   - Description (250 char limit)
   - Address (with geocoding)

2. Verification Screen
   - Tax ID upload (photo of EIN letter)
   - "Pending verification" state
   - Manual review by admin (for MVP)

3. Profile Setup Screen
   - Hours of operation
   - Phone, email, website
   - Logo upload
   - Product/service photos (up to 10)

4. First Bulletin Post
   - "What's new this week?"
   - Text (500 char limit)
   - Optional photo
```

**Tax ID Verification** (MVP - Manual):
```python
# backend/api/verification.py

@router.post("/api/businesses/verify")
async def verify_business(business_id: int, admin_user_id: int):
    """
    Manual verification by admin.
    Later: integrate with IRS Tax ID API or third-party service.
    """
    # Check admin permissions
    # Update business.verified = True
    # Send notification to business owner
    pass
```

---

### Week 5-6: Core Features (Customer Side)

**Goals**:
- Users can discover businesses on map
- Users can search with natural language
- Users can message businesses

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Map view with business pins | Dev | 12h | ⏳ |
| Radius filter (5/10/25 miles) | Dev | 4h | ⏳ |
| Semantic search integration | Dev | 8h | ⏳ |
| Business detail view | Dev | 8h | ⏳ |
| Bulletin board feed | Dev | 6h | ⏳ |
| In-app messaging (real-time) | Dev | 12h | ⏳ |

**Total**: ~50 hours (~1.5 weeks for 1 developer)

**Map View Implementation**:
```typescript
// screens/MapScreen.tsx

import MapboxGL from '@rnmapbox/maps';
import { useQuery } from 'react-query';

function MapScreen() {
  const [userLocation, setUserLocation] = useState<[number, number]>();
  const [radius, setRadius] = useState(10); // miles

  // Fetch businesses in radius
  const { data: businesses } = useQuery(
    ['businesses', userLocation, radius],
    () => fetchBusinessesInRadius(userLocation, radius),
    { enabled: !!userLocation }
  );

  return (
    <View>
      <MapboxGL.MapView>
        <MapboxGL.Camera
          centerCoordinate={userLocation}
          zoomLevel={12}
        />

        {businesses?.map(business => (
          <MapboxGL.PointAnnotation
            key={business.id}
            id={business.id.toString()}
            coordinate={[business.lon, business.lat]}
            onSelected={() => navigateToDetail(business.id)}
          >
            <BusinessMarker category={business.category} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Radius filter */}
      <RadiusSlider value={radius} onChange={setRadius} />

      {/* Search bar (semantic) */}
      <SearchBar onSearch={handleSemanticSearch} />
    </View>
  );
}
```

**Semantic Search API**:
```python
# backend/api/search.py

from HoloLoom import HoloLoom
from geoalchemy2.functions import ST_DWithin, ST_MakePoint
from sqlalchemy import select

@router.get("/api/search")
async def semantic_search(
    query: str,
    lat: float,
    lon: float,
    radius_miles: float = 10.0,
    limit: int = 20
):
    """
    Semantic search + geospatial filtering.
    """
    # Step 1: Get businesses in radius (PostgreSQL PostGIS)
    radius_meters = radius_miles * 1609.34
    user_point = ST_MakePoint(lon, lat)

    stmt = select(Business).where(
        ST_DWithin(Business.location, user_point, radius_meters)
    )
    nearby_businesses = await db.execute(stmt)
    nearby_ids = {b.id for b in nearby_businesses}

    # Step 2: Semantic search (HoloLoom)
    memories = await loom.recall(query)

    # Step 3: Combine (businesses must be in both sets)
    results = []
    for memory in memories:
        business_id = memory.metadata.get('business_id')
        if business_id in nearby_ids:
            business = await db.get(Business, business_id)
            results.append({
                'id': business.id,
                'name': business.business_name,
                'category': business.category,
                'description': business.description,
                'lat': business.location.y,
                'lon': business.location.x,
                'semantic_score': memory.confidence,
                'distance_miles': calculate_distance(lat, lon, business)
            })

            if len(results) >= limit:
                break

    return {"results": results, "total": len(results)}
```

---

### Week 7-8: Reviews & Recommendations

**Goals**:
- Users can leave verified reviews
- Users get personalized recommendations
- Thompson Sampling learns from behavior

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Mark visit/purchase flow | Dev | 8h | ⏳ |
| Seller confirmation (manual for MVP) | Dev | 4h | ⏳ |
| Review submission form | Dev | 6h | ⏳ |
| Review display on business page | Dev | 4h | ⏳ |
| Thompson Sampling integration | Dev | 12h | ⏳ |
| Recommendation feed | Dev | 8h | ⏳ |

**Total**: ~42 hours (~1 week for 1 developer)

**Verified Review Flow**:
```typescript
// After visiting business

1. User marks "I visited this business"
   - Timestamp recorded
   - Notification sent to business

2. Business confirms (via dashboard)
   - "Yes, they visited" or "No, I don't recall"
   - Only confirmed visits can be reviewed

3. User gets prompt to review
   - 1-5 stars
   - Optional text (500 chars)
   - Photos (up to 3)

4. Review appears on business page
   - "Verified Purchase" badge
   - Can't be deleted (only hidden by admin if flagged)
```

**Thompson Sampling Recommendations**:
```python
# backend/api/recommendations.py

from HoloLoom.policy.thompson_sampling import TSBandit

# One bandit per user (stored in memory for MVP)
user_bandits: Dict[int, TSBandit] = {}

@router.get("/api/recommendations/{user_id}")
async def get_recommendations(
    user_id: int,
    lat: float,
    lon: float,
    limit: int = 5
):
    """
    Personalized recommendations using Thompson Sampling.
    """
    # Get or create bandit
    if user_id not in user_bandits:
        user_bandits[user_id] = TSBandit(
            n_arms=1000,  # Max businesses
            strategy=BanditStrategy.EPSILON_GREEDY,
            epsilon=0.15
        )

    bandit = user_bandits[user_id]

    # Get nearby businesses
    nearby = await get_businesses_in_radius(lat, lon, radius_miles=25)

    # Thompson Sampling: choose arms
    recommendations = []
    tried = set()

    for _ in range(limit):
        arm = bandit.choose()
        if arm < len(nearby) and arm not in tried:
            recommendations.append(nearby[arm])
            tried.add(arm)

    return {"recommendations": recommendations}

@router.post("/api/interactions")
async def record_interaction(
    user_id: int,
    business_id: int,
    interaction_type: str,  # 'viewed', 'visited', 'purchased'
    rating: Optional[float] = None
):
    """
    Record user interaction and update bandit.
    """
    # Store in database
    await db.execute(
        insert(UserInteraction).values(
            user_id=user_id,
            business_id=business_id,
            interaction_type=interaction_type,
            created_at=datetime.now()
        )
    )

    # Update Thompson Sampling bandit
    reward_map = {'viewed': 0.1, 'visited': 0.5, 'purchased': 1.0}
    reward = rating if rating else reward_map.get(interaction_type, 0.0)

    if user_id in user_bandits:
        # Find business index in nearby list
        # (For MVP, use business_id directly as arm index)
        user_bandits[user_id].update(business_id, reward)

    return {"status": "recorded", "reward": reward}
```

---

### Week 9-10: Polish & Testing

**Goals**:
- App is stable and performant
- No critical bugs
- Ready for beta testing

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Error handling (network, auth, etc.) | Dev | 8h | ⏳ |
| Loading states & skeletons | Dev | 6h | ⏳ |
| Offline support (basic caching) | Dev | 8h | ⏳ |
| Performance optimization | Dev | 8h | ⏳ |
| Security audit (JWT, SQL injection, XSS) | Dev | 6h | ⏳ |
| Unit tests (backend critical paths) | Dev | 12h | ⏳ |
| Integration tests (API endpoints) | Dev | 8h | ⏳ |
| Manual testing (iOS + Android) | QA | 12h | ⏳ |

**Total**: ~68 hours (~2 weeks for 1 developer)

**Testing Checklist**:

```markdown
## Backend Tests
- [ ] Authentication (signup, login, logout, JWT refresh)
- [ ] Business CRUD (create, read, update, delete)
- [ ] Geospatial queries (radius search, distance calculation)
- [ ] Semantic search (HoloLoom integration)
- [ ] Thompson Sampling (recommendations, updates)
- [ ] Reviews (submission, verification, display)
- [ ] Messaging (send, receive, real-time)

## Frontend Tests
- [ ] Map rendering (businesses display correctly)
- [ ] Search (semantic queries return results)
- [ ] Navigation (all screens accessible)
- [ ] Forms (validation, error messages)
- [ ] Image upload (photos compress correctly)
- [ ] Offline mode (graceful degradation)
- [ ] Performance (< 3s load time on 4G)

## Security Tests
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting (prevent abuse)
- [ ] Authentication bypass attempts
- [ ] Data leakage (can't access other users' data)
```

---

### Week 11-12: Beta Launch

**Goals**:
- 50+ businesses signed up
- 500+ users testing
- Feedback collected

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| TestFlight/Play Store beta setup | Dev | 4h | ⏳ |
| Onboarding flow (first-time users) | Dev | 8h | ⏳ |
| Help/FAQ section | Content | 4h | ⏳ |
| Feedback form (in-app) | Dev | 4h | ⏳ |
| Analytics (Mixpanel or PostHog) | Dev | 6h | ⏳ |
| Business outreach (recruit sellers) | Biz | 20h | ⏳ |
| User acquisition (social media, local ads) | Marketing | 20h | ⏳ |
| Weekly feedback review meetings | Team | 8h | ⏳ |

**Total**: ~74 hours (~2 weeks for team)

**Beta Launch Strategy**:

1. **Choose Pilot City**:
   - Population: 50K-200K (not too big, not too small)
   - Strong local business culture (farmers markets, artisan scene)
   - Suggestions: Asheville NC, Boulder CO, Portland ME, Bend OR

2. **Recruit Businesses** (Goal: 50+ in first month):
   - Attend local business association meetings
   - Visit farmers markets, craft fairs
   - Partner with local chambers of commerce
   - Offer free listings for first 100 businesses

3. **User Acquisition** (Goal: 500+ in first month):
   - Instagram ads targeting local food/craft enthusiasts
   - Facebook groups (local community pages)
   - Flyers at businesses (QR code to download)
   - Referral incentive: "Invite 3 friends, get $10 credit"

4. **Feedback Collection**:
   - In-app feedback form (rate feature, suggest improvement)
   - Weekly user interviews (5-10 users)
   - Business owner check-ins (every 2 weeks)
   - Analytics tracking (drop-off points, most-used features)

---

### Week 13-16: Iteration & Refinement

**Goals**:
- Fix critical bugs from beta
- Add most-requested features
- Prepare for public launch

**Deliverables**:

| Task | Owner | Hours | Status |
|------|-------|-------|--------|
| Bug fixes (P0 and P1) | Dev | 20h | ⏳ |
| Feature additions (top 3 requests) | Dev | 24h | ⏳ |
| Onboarding improvements | Dev | 8h | ⏳ |
| Performance optimization (bottlenecks) | Dev | 8h | ⏳ |
| Content moderation tools (flag reviews/posts) | Dev | 8h | ⏳ |
| App Store assets (screenshots, description) | Design | 8h | ⏳ |
| Public launch plan | Team | 8h | ⏳ |

**Total**: ~84 hours (~3-4 weeks for team)

**Likely Feature Requests** (based on user feedback):
1. **Favorites/Bookmarks**: Save businesses for later
2. **Business hours indicator**: "Open now" badge
3. **Photo galleries**: Swipe through business photos
4. **Social sharing**: "Check out this local shop!"
5. **Push notifications**: "New post from your favorite coffee shop"

---

## 📊 Success Metrics (MVP Phase)

### Week 4 (Business Launch):
- ✅ 10 businesses signed up
- ✅ 5 businesses verified
- ✅ 3 bulletin posts created

### Week 8 (User Launch):
- ✅ 100 users signed up
- ✅ 50 active users (7-day retention)
- ✅ 200 map views
- ✅ 50 semantic searches

### Week 12 (Beta End):
- ✅ 50 businesses signed up
- ✅ 500 users signed up
- ✅ 250 active users (30-day retention)
- ✅ 10 verified purchases
- ✅ 25 verified reviews
- ✅ 75% satisfaction score (user feedback)

### Week 16 (Public Launch):
- ✅ 100 businesses
- ✅ 1000 users
- ✅ 500 active users
- ✅ 50 verified purchases/week
- ✅ 80% satisfaction score

---

## 💰 MVP Budget

### Development Costs:
| Item | Cost | Notes |
|------|------|-------|
| Developer (12 weeks @ $75/hr, 40hr/week) | $36,000 | Full-time contractor |
| Designer (20 hours @ $100/hr) | $2,000 | UI/UX for key screens |
| **Total Development** | **$38,000** | |

### Infrastructure Costs (Monthly):
| Item | Cost | Notes |
|------|------|-------|
| Railway.app (backend + DB) | $15 | Includes PostgreSQL |
| Cloudflare R2 (image storage) | $5 | ~10GB photos |
| MapBox (maps) | $0 | Free tier (50K users) |
| SendGrid (transactional emails) | $0 | Free tier (100/day) |
| **Total Monthly** | **$20** | Scales with usage |

### Marketing Costs (Beta):
| Item | Cost | Notes |
|------|------|-------|
| Instagram ads (2 months) | $500 | $250/month, local targeting |
| Business outreach materials | $200 | Flyers, business cards |
| **Total Marketing** | **$700** | |

### **Total MVP Cost**: $38,700 + ($20/month × 4 months) = **$38,780**

---

## 🚀 Launch Checklist

### Pre-Launch (Week 11):
- [ ] App submitted to TestFlight (iOS) and Play Store beta (Android)
- [ ] 50+ businesses recruited and verified
- [ ] Landing page live (localist.app or chosen domain)
- [ ] Social media accounts created (Instagram, Facebook, Twitter)
- [ ] Press release drafted (local media)
- [ ] User onboarding flow tested

### Launch Day (Week 12):
- [ ] Beta invites sent to first 100 users
- [ ] Social media announcement posts
- [ ] Email to recruited businesses
- [ ] Monitor server load and errors
- [ ] Support email/chat ready (help@localist.app)

### Post-Launch (Weeks 12-16):
- [ ] Daily analytics review (signups, retention, crashes)
- [ ] Weekly user feedback review
- [ ] Bi-weekly business check-ins
- [ ] Bug triage and fixes
- [ ] Feature prioritization based on feedback

---

## 🎯 Key Risks & Mitigation

### Risk 1: Low Business Signups
**Mitigation**:
- Personal outreach to 100+ businesses before launch
- Offer free listings for first 6 months
- Partner with business associations

### Risk 2: Chicken-and-Egg Problem
**Mitigation**:
- Launch businesses first (Weeks 3-6)
- Wait until 50+ businesses before user launch
- Incentivize early users (referral credits)

### Risk 3: Technical Complexity (HoloLoom)
**Mitigation**:
- HoloLoom is production-ready (already built!)
- Fallback to basic search if HoloLoom unavailable
- FAST mode (100-200ms) is sufficient for MVP

### Risk 4: User Retention
**Mitigation**:
- Weekly bulletin posts (fresh content)
- Push notifications for new posts
- Gamification (badges for visits)
- Community challenges

---

## 📞 Next Steps After MVP

### Phase 2: Commerce (Weeks 17-24)
- Payment processing (Stripe Connect)
- In-app purchases
- Transaction tracking
- Advanced recommendations (full HoloLoom)

### Phase 3: Community (Weeks 25-36)
- Live events (glowing icons)
- Seller CRM
- Loyalty programs
- Social features

### Phase 4: Scale (Weeks 37+)
- Multi-city expansion
- Franchise prevention system
- B2B features (local supply chains)
- Revenue optimization

---

**Let's build the MVP!** 🚀

**Target Launch**: 12-16 weeks from kickoff
**Total Investment**: ~$39K
**Expected ROI**: 1000 users × $5/month (future subscription) = $5K/month by Month 6
