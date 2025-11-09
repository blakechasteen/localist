# Localist Backend

FastAPI backend powered by HoloLoom AI for semantic search and personalized recommendations.

## Quick Start

### 1. Prerequisites

- Python 3.10+
- PostgreSQL 15+ with PostGIS extension
- HoloLoom (from mythRL repository)

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install HoloLoom dependencies first (from mythRL repo)
cd ../../mythRL
pip install -r requirements.txt

# Install Localist backend dependencies
cd ../localist/backend
pip install -r requirements.txt
```

### 3. Set Up Database

```bash
# Start PostgreSQL with PostGIS (using Docker)
docker run -d \
  --name localist-db \
  -e POSTGRES_DB=localist \
  -e POSTGRES_USER=localist \
  -e POSTGRES_PASSWORD=dev_password_change_in_prod \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Initialize database schema
python database.py
```

### 4. Configure Environment

Create `.env` file:

```bash
DATABASE_URL=postgresql://localist:dev_password_change_in_prod@localhost:5432/localist
PYTHONPATH=../../mythRL
```

### 5. Run Server

```bash
# Development mode (auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --port 8000
```

Visit:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## API Endpoints

### Search

**GET /api/search**

Semantic search for businesses using HoloLoom.

Query Parameters:
- `query` (required): Natural language search (e.g., "artisan coffee")
- `lat` (optional): User latitude
- `lon` (optional): User longitude
- `radius_miles` (optional): Search radius (default: 10)
- `limit` (optional): Max results (default: 20)

Example:
```bash
curl "http://localhost:8000/api/search?query=artisan+coffee&limit=5"
```

Response:
```json
{
  "query": "artisan coffee",
  "results": [
    {
      "content": "Business: Third Wave Coffee...",
      "confidence": 0.92,
      "metadata": {}
    }
  ],
  "total": 5
}
```

### Businesses

**GET /api/businesses**

List all businesses (optionally filtered).

Query Parameters:
- `category` (optional): Filter by category
- `lat` (optional): User latitude
- `lon` (optional): User longitude
- `radius_miles` (optional): Search radius (default: 10)
- `limit` (optional): Max results (default: 50)

Example:
```bash
curl "http://localhost:8000/api/businesses?category=coffee_shop"
```

### Recommendations

**GET /api/recommendations/{user_id}**

Get personalized recommendations for a user.

Path Parameters:
- `user_id` (required): User identifier

Query Parameters:
- `lat` (optional): User latitude (default: SF)
- `lon` (optional): User longitude (default: SF)
- `limit` (optional): Number of recommendations (default: 5)

Example:
```bash
curl "http://localhost:8000/api/recommendations/user123?limit=3"
```

## Database Schema

See `database.py` for complete schema.

Key tables:
- `users` - Customer accounts
- `businesses` - Local businesses (with PostGIS location)
- `products` - Products offered by businesses
- `bulletin_posts` - Weekly updates from businesses
- `messages` - User ↔ Business messaging
- `reviews` - Verified reviews
- `user_interactions` - For Thompson Sampling recommendations

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Code Formatting

```bash
# Format with Black
black .

# Lint with Ruff
ruff check .
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## HoloLoom Integration

The backend uses HoloLoom for:

1. **Semantic Search** (244D space)
   - Understands "artisan coffee" → finds coffee roasters
   - Multi-scale Matryoshka embeddings (96/192/384D)
   - Compositional caching (291× speedup)

2. **Knowledge Graph**
   - Business relationships (SUPPLIES, COLLABORATES_WITH)
   - Category hierarchies (IS_A)
   - Temporal tracking (when businesses change)

3. **Thompson Sampling** (Phase 2)
   - Personalized recommendations
   - Exploration/exploitation balance
   - Learns from user behavior

See `HOLOLOOM_INTEGRATION.md` for details.

## Production Deployment

### Using Docker

```bash
# Build image
docker build -t localist-backend .

# Run container
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  localist-backend
```

### Using Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Environment Variables

Production `.env`:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key-here
HOLOLOOM_MODE=fast
CORS_ORIGINS=https://localist.app
```

## Troubleshooting

### HoloLoom not found

Make sure `PYTHONPATH` includes mythRL:
```bash
export PYTHONPATH="../../mythRL:$PYTHONPATH"
```

### PostGIS extension error

Run manually in PostgreSQL:
```sql
CREATE EXTENSION postgis;
```

### Database connection failed

Check PostgreSQL is running:
```bash
docker ps  # Should see localist-db
docker logs localist-db  # Check for errors
```

## Next Steps

See `MVP_ROADMAP.md` for complete implementation plan.

Phase 1 (Current):
- [x] FastAPI setup with HoloLoom
- [x] Database schema
- [x] Semantic search endpoint
- [ ] Business signup API
- [ ] Authentication (JWT)
- [ ] React Native app integration

Phase 2:
- [ ] Payment processing (Stripe Connect)
- [ ] Thompson Sampling recommendations
- [ ] Advanced geospatial queries
- [ ] Real-time messaging
