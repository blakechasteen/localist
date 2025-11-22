"""
Localist Backend - Main FastAPI Application

This is the core API server for the Localist platform, powered by HoloLoom AI.

Author: Blake Chasteen
Date: November 8, 2025
"""

from fastapi import FastAPI, HTTPException, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import sys
from pathlib import Path

# Add HoloLoom to path (assumes mythRL is sibling directory)
HOLOLOOM_PATH = Path(__file__).parent.parent.parent.parent / "mythRL"
if HOLOLOOM_PATH.exists():
    sys.path.insert(0, str(HOLOLOOM_PATH))

from HoloLoom import HoloLoom
from HoloLoom.config import Config

# Import Localist modules
from backend.database import get_db, init_db
from backend.api.auth_routes import router as auth_router
from backend.api.notification_routes import router as notification_router
from backend.websocket import websocket_endpoint
from backend.notifications import cleanup_notification_service

# Global state
app_state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Initializes HoloLoom and database on startup, cleans up on shutdown.
    """
    # Startup: Initialize database and HoloLoom
    print("🚀 Starting Localist API...")

    # Initialize database
    print("🗄️  Initializing database...")
    try:
        init_db()
        print("✅ Database ready!")
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
        print("   Continuing with existing database schema...")

    # Initialize HoloLoom AI
    print("🧠 Initializing HoloLoom AI...")
    config = Config.fast()  # Use FAST mode for good balance
    loom = HoloLoom(config=config)
    await loom.__aenter__()

    # Store in app state
    app_state['loom'] = loom

    # Seed with test data (for MVP testing)
    await seed_test_data(loom)

    print("✅ HoloLoom ready!")
    print("✅ Localist API running on http://localhost:8000")
    print("📖 API docs: http://localhost:8000/docs")
    print("📡 WebSocket: ws://localhost:8000/ws/messages")

    yield

    # Shutdown: Cleanup
    print("🛑 Shutting down Localist API...")

    # Cleanup notification service
    await cleanup_notification_service()

    # Cleanup HoloLoom
    await loom.__aexit__(None, None, None)
    print("✅ Cleanup complete")


async def seed_test_data(loom: HoloLoom):
    """Seed HoloLoom with test business data for MVP."""
    test_businesses = [
        {
            "name": "Third Wave Coffee",
            "category": "coffee_shop",
            "description": "Artisan coffee roasters with outdoor seating and fresh pastries",
            "address": "123 Main St, San Francisco, CA",
            "lat": 37.7749,
            "lon": -122.4194
        },
        {
            "name": "Pottery Paradise",
            "category": "art_studio",
            "description": "Handmade ceramics and pottery wheel-throwing classes",
            "address": "456 Market St, San Francisco, CA",
            "lat": 37.7849,
            "lon": -122.4094
        },
        {
            "name": "Local Honey Collective",
            "category": "food_artisan",
            "description": "Raw honey from local beekeepers, seasonal varieties",
            "address": "789 Valencia St, San Francisco, CA",
            "lat": 37.7649,
            "lon": -122.4294
        },
        {
            "name": "Heritage Bakery",
            "category": "bakery",
            "description": "Sourdough bread and pastries made with heritage grains",
            "address": "321 Mission St, San Francisco, CA",
            "lat": 37.7949,
            "lon": -122.3994
        },
        {
            "name": "Woodcraft Studios",
            "category": "woodworking",
            "description": "Custom furniture and woodworking classes for beginners",
            "address": "654 Folsom St, San Francisco, CA",
            "lat": 37.7549,
            "lon": -122.4394
        }
    ]

    for biz in test_businesses:
        await loom.experience(f"""
            Business: {biz['name']}
            Category: {biz['category']}
            Description: {biz['description']}
            Address: {biz['address']}
            Location: {biz['lat']}, {biz['lon']}
        """)

    print(f"✅ Seeded {len(test_businesses)} test businesses into HoloLoom")


# Create FastAPI app
app = FastAPI(
    title="Localist API",
    description="Local business discovery platform powered by HoloLoom AI",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware (allow React Native app to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(notification_router)


# ============================================================================
# WebSocket Endpoints
# ============================================================================

@app.websocket("/ws/messages")
async def websocket_messages_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time messaging.

    Connect: ws://localhost:8000/ws/messages?token=<access_token>
    """
    await websocket_endpoint(websocket, token, db)


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Localist API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "localist-api",
        "hololoom": "ready" if 'loom' in app_state else "not initialized"
    }


# ============================================================================
# Search Endpoints
# ============================================================================

@app.get("/api/search")
async def semantic_search(
    query: str,
    lat: float = None,
    lon: float = None,
    radius_miles: float = 10.0,
    limit: int = 20
):
    """
    Semantic search for local businesses.

    Args:
        query: Natural language search query (e.g., "artisan coffee")
        lat: User latitude (optional for MVP)
        lon: User longitude (optional for MVP)
        radius_miles: Search radius in miles (default: 10)
        limit: Maximum results to return (default: 20)

    Returns:
        List of businesses matching the query

    Example:
        GET /api/search?query=artisan+coffee&lat=37.7749&lon=-122.4194&radius_miles=5
    """
    if 'loom' not in app_state:
        raise HTTPException(status_code=503, detail="HoloLoom not initialized")

    loom = app_state['loom']

    # Use HoloLoom semantic search
    memories = await loom.recall(query)

    # For MVP, return all results (geospatial filtering in Phase 2)
    results = []
    for memory in memories[:limit]:
        # Parse business data from memory content
        # (In production, this would query PostgreSQL)
        results.append({
            "content": memory.content,
            "confidence": memory.confidence,
            "metadata": memory.metadata if hasattr(memory, 'metadata') else {}
        })

    return {
        "query": query,
        "results": results,
        "total": len(results),
        "location": {"lat": lat, "lon": lon} if lat and lon else None,
        "radius_miles": radius_miles
    }


@app.get("/api/businesses")
async def list_businesses(
    category: str = None,
    lat: float = None,
    lon: float = None,
    radius_miles: float = 10.0,
    limit: int = 50
):
    """
    List all businesses (optionally filtered by category or location).

    Args:
        category: Filter by category (e.g., "coffee_shop")
        lat: User latitude (optional)
        lon: User longitude (optional)
        radius_miles: Search radius in miles (default: 10)
        limit: Maximum results (default: 50)

    Returns:
        List of businesses
    """
    if 'loom' not in app_state:
        raise HTTPException(status_code=503, detail="HoloLoom not initialized")

    loom = app_state['loom']

    # For MVP, query HoloLoom for all businesses
    # (In production, this would be a PostgreSQL query)
    query = f"businesses in {category}" if category else "all businesses"
    memories = await loom.recall(query)

    results = []
    for memory in memories[:limit]:
        results.append({
            "content": memory.content,
            "confidence": memory.confidence,
            "metadata": memory.metadata if hasattr(memory, 'metadata') else {}
        })

    return {
        "businesses": results,
        "total": len(results),
        "filters": {
            "category": category,
            "location": {"lat": lat, "lon": lon} if lat and lon else None,
            "radius_miles": radius_miles
        }
    }


# ============================================================================
# Recommendations Endpoint
# ============================================================================

@app.get("/api/recommendations/{user_id}")
async def get_recommendations(
    user_id: str,
    lat: float = 37.7749,
    lon: float = -122.4194,
    limit: int = 5
):
    """
    Get personalized business recommendations using Thompson Sampling.

    Args:
        user_id: User identifier
        lat: User latitude
        lon: User longitude
        limit: Number of recommendations (default: 5)

    Returns:
        Personalized business recommendations

    Note: For MVP, this returns generic recommendations.
    Full Thompson Sampling integration in Phase 2.
    """
    if 'loom' not in app_state:
        raise HTTPException(status_code=503, detail="HoloLoom not initialized")

    loom = app_state['loom']

    # For MVP, return top-rated businesses
    # (Phase 2 will add Thompson Sampling based on user behavior)
    memories = await loom.recall("highly rated local businesses")

    recommendations = []
    for memory in memories[:limit]:
        recommendations.append({
            "content": memory.content,
            "confidence": memory.confidence,
            "reason": "Popular in your area"  # Placeholder
        })

    return {
        "user_id": user_id,
        "recommendations": recommendations,
        "location": {"lat": lat, "lon": lon}
    }


# ============================================================================
# Run Application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
