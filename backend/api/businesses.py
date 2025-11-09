"""
Business Signup and Verification API

Endpoints for businesses to sign up, verify, and manage profiles.

Author: Blake Chasteen
Date: November 8, 2025
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime, timedelta
import hashlib
import secrets

from database import get_db, Business
from geoalchemy2.functions import ST_GeogFromText

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


# ============================================================================
# Request/Response Models
# ============================================================================

class BusinessSignupRequest(BaseModel):
    """Business signup request."""
    business_name: str
    owner_email: EmailStr
    category: str
    description: str
    address: str
    phone: Optional[str] = None
    website_url: Optional[str] = None
    hours: Optional[Dict[str, str]] = None  # {"monday": "8am-5pm", ...}
    tax_id: str  # Will be hashed for privacy


class BusinessResponse(BaseModel):
    """Business response."""
    id: int
    business_name: str
    category: str
    description: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    website_url: Optional[str]
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VerificationRequest(BaseModel):
    """Admin verification request."""
    business_id: int
    approved: bool
    notes: Optional[str] = None


# ============================================================================
# Business Signup Endpoints
# ============================================================================

@router.post("/signup", response_model=BusinessResponse)
async def signup_business(
    request: BusinessSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new business.

    Steps:
    1. Hash tax ID for privacy
    2. Geocode address to lat/lon (MVP: manual)
    3. Create business record
    4. Set verified=False (requires manual verification)

    Returns:
        Business record with pending verification status
    """
    # Check if business name already exists
    existing = db.query(Business).filter(
        Business.business_name == request.business_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Business name already registered. Contact support if this is your business."
        )

    # Hash tax ID for privacy (SHA-256)
    tax_id_hash = hashlib.sha256(request.tax_id.encode()).hexdigest()

    # Check if tax ID already used
    existing_tax_id = db.query(Business).filter(
        Business.tax_id_hash == tax_id_hash
    ).first()

    if existing_tax_id:
        raise HTTPException(
            status_code=400,
            detail="Tax ID already registered. Contact support if you need help."
        )

    # TODO: Geocode address to lat/lon
    # For MVP, use default San Francisco location
    # In production, use Google Maps Geocoding API or similar
    lat, lon = 37.7749, -122.4194  # Default: San Francisco

    # Create business
    business = Business(
        business_name=request.business_name,
        category=request.category,
        description=request.description,
        address=request.address,
        location=ST_GeogFromText(f'POINT({lon} {lat})'),
        phone=request.phone,
        email=request.owner_email,
        website_url=request.website_url,
        hours=request.hours,
        tax_id_hash=tax_id_hash,
        verified=False  # Requires manual verification
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    # TODO: Send verification email to admin
    # TODO: Send confirmation email to business owner

    return business


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(
    business_id: int,
    db: Session = Depends(get_db)
):
    """Get business by ID."""
    business = db.query(Business).filter(Business.id == business_id).first()

    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    return business


@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: int,
    request: BusinessSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Update business profile.

    Note: Businesses can only update their own profile.
    TODO: Add authentication to verify ownership.
    """
    business = db.query(Business).filter(Business.id == business_id).first()

    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Update fields
    business.business_name = request.business_name
    business.category = request.category
    business.description = request.description
    business.address = request.address
    business.phone = request.phone
    business.website_url = request.website_url
    business.hours = request.hours
    business.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(business)

    return business


@router.post("/{business_id}/verify")
async def verify_business(
    request: VerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Verify business (admin only).

    For MVP, this is unprotected. In production, require admin authentication.

    Args:
        request: Verification request with approval status

    Returns:
        Updated business record
    """
    business = db.query(Business).filter(
        Business.id == request.business_id
    ).first()

    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if request.approved:
        business.verified = True
        message = f"Business '{business.business_name}' verified successfully"
    else:
        # In production, might want to keep record with notes
        # For MVP, just delete
        db.delete(business)
        db.commit()
        return {"message": "Business rejected and removed", "notes": request.notes}

    db.commit()
    db.refresh(business)

    # TODO: Send email to business owner about verification status

    return {
        "message": message,
        "business_id": business.id,
        "verified": business.verified
    }


@router.post("/{business_id}/logo")
async def upload_logo(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload business logo.

    For MVP, saves to local filesystem.
    In production, upload to S3 or Cloudflare R2.

    Args:
        business_id: Business ID
        file: Image file (JPEG, PNG)

    Returns:
        URL to uploaded logo
    """
    business = db.query(Business).filter(Business.id == business_id).first()

    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # TODO: Save file to storage
    # For MVP, just return a placeholder URL
    logo_url = f"https://placeholders.localist.app/logos/{business_id}.jpg"

    # Update business record
    business.logo_url = logo_url
    business.updated_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url
    }


@router.get("/category/{category}")
async def get_businesses_by_category(
    category: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all businesses in a category.

    Args:
        category: Business category (e.g., "coffee_shop")
        limit: Maximum results (default: 50)

    Returns:
        List of businesses in category
    """
    businesses = db.query(Business).filter(
        Business.category == category,
        Business.verified == True
    ).limit(limit).all()

    return {"category": category, "businesses": businesses, "total": len(businesses)}
