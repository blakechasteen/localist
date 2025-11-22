"""
Authentication API Routes

Handles login, signup, token refresh, and logout
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..database import get_db, User, Business
from ..auth import (
    LoginRequest,
    SignupRequest,
    Token,
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user,
    TokenPayload,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/signup", response_model=Token)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account (patron or vendor).

    For vendors, this creates a basic account. They still need to complete
    VendorSignup flow for business verification.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        first_name=request.name.split()[0] if request.name else "",
        last_name=" ".join(request.name.split()[1:]) if len(request.name.split()) > 1 else "",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create tokens
    access_token = create_access_token(user.id, user.email, request.user_type)
    refresh_token = create_refresh_token(user.id, user.email, request.user_type)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.

    Returns access and refresh tokens.
    """
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()

    # Create tokens
    access_token = create_access_token(user.id, user.email, request.user_type)
    refresh_token = create_refresh_token(user.id, user.email, request.user_type)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token.

    Send refresh token in request body: {"refresh_token": "..."}
    """
    try:
        payload = verify_token(refresh_token)

        # Ensure it's a refresh token
        # (You could add a "type" field to the token payload to check this)

        # Create new tokens
        access_token = create_access_token(
            payload.user_id,
            payload.email,
            payload.user_type
        )
        new_refresh_token = create_refresh_token(
            payload.user_id,
            payload.email,
            payload.user_type
        )

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user information.

    Requires valid access token in Authorization header:
    Authorization: Bearer <access_token>
    """
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get business info if vendor
    business = None
    if current_user.user_type == "vendor":
        business = db.query(Business).filter(
            Business.owner_user_id == user.id
        ).first()

    return {
        "id": user.id,
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}".strip(),
        "user_type": current_user.user_type,
        "created_at": user.created_at,
        "business": {
            "id": business.id,
            "name": business.business_name,
            "verified": business.verified,
        } if business else None,
    }


@router.post("/logout")
async def logout(current_user: TokenPayload = Depends(get_current_user)):
    """
    Logout (client should delete tokens).

    This is mostly a placeholder - actual logout happens client-side
    by deleting the stored tokens.

    In a production app, you might want to:
    - Maintain a token blacklist
    - Store tokens in Redis with expiration
    - Implement token revocation
    """
    return {"message": "Logged out successfully"}
