"""
Authentication Module for Localist Backend

Implements JWT authentication with access/refresh tokens
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for token extraction
security = HTTPBearer()


# Pydantic Models
class TokenPayload(BaseModel):
    user_id: int
    email: str
    user_type: str  # 'patron' or 'vendor'
    exp: datetime


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str
    user_type: str  # 'patron' or 'vendor'


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    user_type: str  # 'patron' or 'vendor'


# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


# Token utilities
def create_access_token(user_id: int, email: str, user_type: str) -> str:
    """Create a JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "user_id": user_id,
        "email": email,
        "user_type": user_type,
        "exp": expire,
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: int, email: str, user_type: str) -> str:
    """Create a JWT refresh token."""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "user_id": user_id,
        "email": email,
        "user_type": user_type,
        "exp": expire,
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> TokenPayload:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency for protected routes
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenPayload:
    """
    Dependency to get the current authenticated user.

    Usage:
        @app.get("/api/protected")
        async def protected_route(current_user: TokenPayload = Depends(get_current_user)):
            return {"user_id": current_user.user_id}
    """
    token = credentials.credentials
    return verify_token(token)


# Optional dependency (returns None if not authenticated)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[TokenPayload]:
    """Optional authentication - returns None if not authenticated."""
    if credentials is None:
        return None

    try:
        return verify_token(credentials.credentials)
    except HTTPException:
        return None


# Vendor-only dependency
async def get_current_vendor(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """Ensure the current user is a vendor."""
    if current_user.user_type != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to vendors"
        )
    return current_user


# Patron-only dependency
async def get_current_patron(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """Ensure the current user is a patron."""
    if current_user.user_type != "patron":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to patrons"
        )
    return current_user
