"""
Notification API Routes

Endpoints for managing push notification tokens and preferences.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from backend.database import get_db
from backend.models import User
from backend.auth import get_current_user, TokenPayload
from backend.notifications import (
    notification_service,
    notify_new_message,
    notify_new_bulletin,
    notify_recommendation,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ============================================================================
# Request/Response Models
# ============================================================================

class RegisterTokenRequest(BaseModel):
    """Request to register or update Expo push token."""
    expo_push_token: str


class NotificationPreferencesRequest(BaseModel):
    """Request to update notification preferences."""
    messages: Optional[bool] = None
    bulletins: Optional[bool] = None
    recommendations: Optional[bool] = None
    reviews: Optional[bool] = None


class NotificationPreferencesResponse(BaseModel):
    """User's notification preferences."""
    messages: bool
    bulletins: bool
    recommendations: bool
    reviews: bool

    class Config:
        from_attributes = True


class TestNotificationRequest(BaseModel):
    """Request to send a test notification."""
    title: str
    body: str


# ============================================================================
# Token Management
# ============================================================================

@router.post("/register-token")
async def register_push_token(
    request: RegisterTokenRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Register or update user's Expo push token.

    **Usage:**
    - Call this when user grants notification permissions
    - Call this on app startup if token exists
    - Call this when token changes (rare)

    **Request:**
    ```json
    {
      "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    }
    ```

    **Response:**
    ```json
    {
      "success": true,
      "message": "Push token registered successfully"
    }
    ```
    """
    # Validate token format
    token = request.expo_push_token
    if not notification_service._validate_push_token(token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Expo push token format"
        )

    # Update user's push token in database
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.expo_push_token = token
    db.commit()

    return {
        "success": True,
        "message": "Push token registered successfully"
    }


@router.delete("/unregister-token")
async def unregister_push_token(
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove user's Expo push token (disable notifications).

    **Usage:**
    - Call this when user revokes notification permissions
    - Call this on logout

    **Response:**
    ```json
    {
      "success": true,
      "message": "Push token removed successfully"
    }
    ```
    """
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.expo_push_token = None
    db.commit()

    return {
        "success": True,
        "message": "Push token removed successfully"
    }


# ============================================================================
# Notification Preferences
# ============================================================================

@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's notification preferences.

    **Response:**
    ```json
    {
      "messages": true,
      "bulletins": true,
      "recommendations": false,
      "reviews": true
    }
    ```
    """
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Default all to True if not set
    return NotificationPreferencesResponse(
        messages=getattr(user, 'notifications_messages', True),
        bulletins=getattr(user, 'notifications_bulletins', True),
        recommendations=getattr(user, 'notifications_recommendations', True),
        reviews=getattr(user, 'notifications_reviews', True),
    )


@router.put("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    request: NotificationPreferencesRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user's notification preferences.

    **Request:**
    ```json
    {
      "messages": true,
      "bulletins": false,
      "recommendations": true,
      "reviews": true
    }
    ```

    Only include fields you want to update.

    **Response:**
    ```json
    {
      "messages": true,
      "bulletins": false,
      "recommendations": true,
      "reviews": true
    }
    ```
    """
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update only provided preferences
    if request.messages is not None:
        user.notifications_messages = request.messages

    if request.bulletins is not None:
        user.notifications_bulletins = request.bulletins

    if request.recommendations is not None:
        user.notifications_recommendations = request.recommendations

    if request.reviews is not None:
        user.notifications_reviews = request.reviews

    db.commit()

    return NotificationPreferencesResponse(
        messages=user.notifications_messages,
        bulletins=user.notifications_bulletins,
        recommendations=user.notifications_recommendations,
        reviews=user.notifications_reviews,
    )


# ============================================================================
# Test Notifications
# ============================================================================

@router.post("/test")
async def send_test_notification(
    request: TestNotificationRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a test notification to the current user.

    **Usage:**
    - Test that push notifications are working
    - Verify token is correctly registered

    **Request:**
    ```json
    {
      "title": "Test Notification",
      "body": "This is a test from Localist!"
    }
    ```

    **Response:**
    ```json
    {
      "success": true,
      "message": "Test notification sent",
      "ticket": {
        "status": "ok",
        "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
      }
    }
    ```
    """
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.expo_push_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No push token registered. Please register a token first."
        )

    result = await notification_service.send_notification(
        push_token=user.expo_push_token,
        title=request.title,
        body=request.body,
        data={"type": "test"},
        sound="default",
        priority="normal",
    )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to send notification")
        )

    return {
        "success": True,
        "message": "Test notification sent",
        "ticket": result.get("ticket"),
    }


# ============================================================================
# Notification Receipts
# ============================================================================

@router.get("/receipts")
async def get_notification_receipts(
    ticket_ids: Optional[str] = None,
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Check delivery status of sent notifications.

    **Usage:**
    - Verify that notifications were delivered
    - Debug notification issues

    **Query Parameters:**
    - `ticket_ids` (optional): Comma-separated list of ticket IDs
      - If not provided, checks all pending receipts

    **Response:**
    ```json
    {
      "receipts": {
        "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX": {
          "status": "ok"
        },
        "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY": {
          "status": "error",
          "message": "DeviceNotRegistered",
          "details": {
            "error": "DeviceNotRegistered"
          }
        }
      }
    }
    ```

    **Receipt Statuses:**
    - `ok`: Notification was delivered successfully
    - `error`: Notification failed to deliver
      - `DeviceNotRegistered`: Token is invalid/expired
      - `MessageTooBig`: Notification payload too large
      - `MessageRateExceeded`: Too many notifications sent
    """
    if ticket_ids:
        ticket_list = [tid.strip() for tid in ticket_ids.split(",")]
        receipts = await notification_service.get_notification_receipts(ticket_list)
    else:
        receipts = await notification_service.get_notification_receipts()

    return {
        "receipts": receipts
    }
