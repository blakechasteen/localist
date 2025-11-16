"""
Localist Database Configuration

SQLAlchemy setup with PostgreSQL + PostGIS for geospatial queries.

Author: Blake Chasteen
Date: November 8, 2025
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DECIMAL, TIMESTAMP, JSON, CheckConstraint, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from geoalchemy2 import Geography
from datetime import datetime
import os

# Database URL (from environment variable or default for development)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://localist:dev_pass@localhost:5432/localist"
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=True)  # echo=True logs SQL queries

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# ============================================================================
# Database Models
# ============================================================================

class User(Base):
    """Customer (buyer) accounts."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    last_login = Column(TIMESTAMP)

    # Push notifications
    expo_push_token = Column(String(100))  # ExponentPushToken[...] format

    # Notification preferences (default all True)
    notifications_messages = Column(Boolean, default=True)
    notifications_bulletins = Column(Boolean, default=True)
    notifications_recommendations = Column(Boolean, default=True)
    notifications_reviews = Column(Boolean, default=True)

    # Relationships
    reviews = relationship("Review", back_populates="user")
    messages = relationship("Message", back_populates="user")
    interactions = relationship("UserInteraction", back_populates="user")


class Business(Base):
    """Local businesses (sellers)."""
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"))
    business_name = Column(String(255), nullable=False, index=True)
    tax_id_hash = Column(String(64), nullable=False)  # Hashed for privacy
    verified = Column(Boolean, default=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    address = Column(Text)
    location = Column(Geography(geometry_type='POINT', srid=4326))  # PostGIS
    phone = Column(String(20))
    email = Column(String(255))
    website_url = Column(Text)
    hours = Column(JSON)  # {"monday": "8am-5pm", ...}
    logo_url = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User")
    products = relationship("Product", back_populates="business")
    bulletin_posts = relationship("BulletinPost", back_populates="business")
    reviews = relationship("Review", back_populates="business")
    messages = relationship("Message", back_populates="business")
    interactions = relationship("UserInteraction", back_populates="business")


class Product(Base):
    """Products offered by businesses."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2))
    in_stock = Column(Boolean, default=True)
    image_url = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="products")


class BulletinPost(Base):
    """Weekly bulletin board posts from businesses."""
    __tablename__ = "bulletin_posts"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text)
    active_until = Column(TIMESTAMP)  # Expires after 1 week
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="bulletin_posts")


class Message(Base):
    """Messages between users and businesses."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    message_text = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="messages")
    business = relationship("Business", back_populates="messages")


class Review(Base):
    """Verified reviews from customers."""
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text)
    verified_purchase = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reviews")
    business = relationship("Business", back_populates="reviews")


class UserInteraction(Base):
    """User interactions for Thompson Sampling recommendations."""
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)  # 'viewed', 'visited', 'purchased'
    interaction_metadata = Column(JSON)  # Renamed from 'metadata' to avoid SQLAlchemy reserved name
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="interactions")
    business = relationship("Business", back_populates="interactions")


# ============================================================================
# Database Initialization
# ============================================================================

def init_db():
    """
    Initialize database: create all tables and extensions.

    Run this once to set up the database schema.
    """
    from sqlalchemy import text

    # Create PostGIS extension (must be run as superuser)
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
            print("✅ PostGIS extension enabled")
        except Exception as e:
            print(f"⚠️  Could not create PostGIS extension: {e}")
            print("   Run manually: CREATE EXTENSION postgis;")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def get_db():
    """
    Dependency for FastAPI routes to get database session.

    Usage:
        @app.get("/api/businesses")
        async def get_businesses(db: Session = Depends(get_db)):
            businesses = db.query(Business).all()
            return businesses
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Helper Functions
# ============================================================================

def create_test_business(db, name: str, category: str, description: str,
                        lat: float, lon: float, address: str = None):
    """
    Create a test business in the database.

    Args:
        db: Database session
        name: Business name
        category: Business category
        description: Business description
        lat: Latitude
        lon: Longitude
        address: Street address (optional)

    Returns:
        Created Business object
    """
    from geoalchemy2.functions import ST_GeogFromText

    business = Business(
        business_name=name,
        category=category,
        description=description,
        address=address or f"{lat}, {lon}",
        location=ST_GeogFromText(f'POINT({lon} {lat})'),  # Note: lon, lat order!
        tax_id_hash="test_hash",
        verified=True
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    return business


if __name__ == "__main__":
    """Initialize database when run as script."""
    print("🗄️  Initializing Localist database...")
    init_db()
    print("✅ Database ready!")
