"""
Push Notification Service for Localist

Integrates with Expo Push Notification API to send notifications to mobile devices.
Handles message notifications, bulletin updates, and system alerts.
"""

import asyncio
import aiohttp
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session

# Expo Push API Configuration
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_PUSH_RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts"

# Notification types
class NotificationType:
    NEW_MESSAGE = "new_message"
    NEW_BULLETIN = "new_bulletin"
    BUSINESS_UPDATE = "business_update"
    RECOMMENDATION = "recommendation"
    REVIEW_RESPONSE = "review_response"
    SYSTEM_ALERT = "system_alert"


class PushNotificationService:
    """
    Service for sending push notifications via Expo Push API.

    Supports:
    - Individual notifications
    - Batch notifications (up to 100 per request)
    - Notification receipts and error tracking
    - User notification preferences
    """

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.pending_receipts: List[str] = []

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session for API calls."""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    async def close(self):
        """Close the aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()

    def _validate_push_token(self, token: str) -> bool:
        """
        Validate Expo push token format.

        Valid formats:
        - ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
        - ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]
        """
        if not token:
            return False

        return (
            token.startswith("ExponentPushToken[") or
            token.startswith("ExpoPushToken[")
        ) and token.endswith("]")

    async def send_notification(
        self,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        badge: Optional[int] = None,
        sound: str = "default",
        priority: str = "default",
        channel_id: Optional[str] = None,
    ) -> Dict:
        """
        Send a single push notification.

        Args:
            push_token: Expo push token (ExponentPushToken[...])
            title: Notification title
            body: Notification body text
            data: Custom data payload (optional)
            badge: Badge count for app icon (optional)
            sound: Sound to play ("default" or null for silent)
            priority: "default", "normal", or "high"
            channel_id: Android notification channel ID

        Returns:
            Response from Expo Push API with ticket ID
        """
        if not self._validate_push_token(push_token):
            return {
                "status": "error",
                "message": f"Invalid push token format: {push_token}"
            }

        message = {
            "to": push_token,
            "title": title,
            "body": body,
            "sound": sound,
            "priority": priority,
        }

        if data:
            message["data"] = data

        if badge is not None:
            message["badge"] = badge

        if channel_id:
            message["channelId"] = channel_id

        try:
            session = await self._get_session()
            async with session.post(
                EXPO_PUSH_URL,
                json=[message],
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()

                if response.status == 200 and result.get("data"):
                    ticket = result["data"][0]

                    # Store ticket ID for receipt checking
                    if ticket.get("status") == "ok" and ticket.get("id"):
                        self.pending_receipts.append(ticket["id"])

                    return {
                        "status": "success",
                        "ticket": ticket
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Expo API error: {result}"
                    }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to send notification: {str(e)}"
            }

    async def send_batch_notifications(
        self,
        notifications: List[Dict]
    ) -> List[Dict]:
        """
        Send multiple push notifications in a single request.

        Args:
            notifications: List of notification objects (max 100)
                Each object should have: to, title, body, and optional data/badge/sound

        Returns:
            List of ticket responses from Expo Push API
        """
        if not notifications:
            return []

        # Expo API limit is 100 notifications per request
        if len(notifications) > 100:
            # Split into batches of 100
            batches = [notifications[i:i+100] for i in range(0, len(notifications), 100)]
            results = []
            for batch in batches:
                batch_results = await self.send_batch_notifications(batch)
                results.extend(batch_results)
            return results

        # Validate all push tokens
        messages = []
        for notif in notifications:
            token = notif.get("to")
            if not self._validate_push_token(token):
                continue

            message = {
                "to": token,
                "title": notif.get("title", "Localist"),
                "body": notif.get("body", ""),
                "sound": notif.get("sound", "default"),
                "priority": notif.get("priority", "default"),
            }

            if notif.get("data"):
                message["data"] = notif["data"]

            if notif.get("badge") is not None:
                message["badge"] = notif["badge"]

            if notif.get("channelId"):
                message["channelId"] = notif["channelId"]

            messages.append(message)

        if not messages:
            return []

        try:
            session = await self._get_session()
            async with session.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()

                if response.status == 200 and result.get("data"):
                    tickets = result["data"]

                    # Store ticket IDs for receipt checking
                    for ticket in tickets:
                        if ticket.get("status") == "ok" and ticket.get("id"):
                            self.pending_receipts.append(ticket["id"])

                    return tickets
                else:
                    return [{
                        "status": "error",
                        "message": f"Expo API error: {result}"
                    }]

        except Exception as e:
            return [{
                "status": "error",
                "message": f"Failed to send batch notifications: {str(e)}"
            }]

    async def get_notification_receipts(
        self,
        ticket_ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Check delivery receipts for sent notifications.

        Args:
            ticket_ids: List of ticket IDs to check (max 1000)
                If None, checks all pending receipts

        Returns:
            Dictionary of ticket_id -> receipt status
        """
        if ticket_ids is None:
            ticket_ids = self.pending_receipts

        if not ticket_ids:
            return {}

        # Expo API limit is 1000 ticket IDs per request
        if len(ticket_ids) > 1000:
            batches = [ticket_ids[i:i+1000] for i in range(0, len(ticket_ids), 1000)]
            all_receipts = {}
            for batch in batches:
                batch_receipts = await self.get_notification_receipts(batch)
                all_receipts.update(batch_receipts)
            return all_receipts

        try:
            session = await self._get_session()
            async with session.post(
                EXPO_PUSH_RECEIPT_URL,
                json={"ids": ticket_ids},
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()

                if response.status == 200 and result.get("data"):
                    # Remove checked tickets from pending list
                    for ticket_id in ticket_ids:
                        if ticket_id in self.pending_receipts:
                            self.pending_receipts.remove(ticket_id)

                    return result["data"]
                else:
                    return {}

        except Exception as e:
            print(f"Failed to get notification receipts: {str(e)}")
            return {}


# Global notification service instance
notification_service = PushNotificationService()


# ============================================================================
# High-Level Notification Functions
# ============================================================================

async def notify_new_message(
    recipient_push_token: str,
    sender_name: str,
    message_preview: str,
    conversation_id: int,
) -> Dict:
    """
    Notify user of a new message.

    Args:
        recipient_push_token: Expo push token of the recipient
        sender_name: Name of the person who sent the message
        message_preview: First ~50 chars of the message
        conversation_id: ID for opening the conversation

    Returns:
        Notification send result
    """
    return await notification_service.send_notification(
        push_token=recipient_push_token,
        title=f"Message from {sender_name}",
        body=message_preview[:100],
        data={
            "type": NotificationType.NEW_MESSAGE,
            "conversation_id": conversation_id,
            "sender_name": sender_name,
        },
        sound="default",
        priority="high",
        channel_id="messages",
    )


async def notify_new_bulletin(
    subscriber_push_tokens: List[str],
    business_name: str,
    bulletin_preview: str,
    business_id: int,
) -> List[Dict]:
    """
    Notify subscribers of a new bulletin post.

    Args:
        subscriber_push_tokens: List of Expo push tokens for subscribers
        business_name: Name of the business that posted
        bulletin_preview: Preview of bulletin content
        business_id: ID for opening the business profile

    Returns:
        List of notification send results
    """
    notifications = [
        {
            "to": token,
            "title": f"New from {business_name}",
            "body": bulletin_preview[:100],
            "data": {
                "type": NotificationType.NEW_BULLETIN,
                "business_id": business_id,
                "business_name": business_name,
            },
            "sound": "default",
            "priority": "normal",
            "channelId": "bulletins",
        }
        for token in subscriber_push_tokens
    ]

    return await notification_service.send_batch_notifications(notifications)


async def notify_recommendation(
    user_push_token: str,
    business_name: str,
    business_category: str,
    business_id: int,
) -> Dict:
    """
    Notify user of a personalized recommendation.

    Args:
        user_push_token: Expo push token of the user
        business_name: Name of recommended business
        business_category: Category of the business
        business_id: ID for opening the business profile

    Returns:
        Notification send result
    """
    return await notification_service.send_notification(
        push_token=user_push_token,
        title="New Recommendation for You",
        body=f"Check out {business_name}, a local {business_category}",
        data={
            "type": NotificationType.RECOMMENDATION,
            "business_id": business_id,
            "business_name": business_name,
        },
        sound="default",
        priority="normal",
        channel_id="recommendations",
    )


async def notify_review_response(
    reviewer_push_token: str,
    business_name: str,
    response_preview: str,
    review_id: int,
) -> Dict:
    """
    Notify user that a business responded to their review.

    Args:
        reviewer_push_token: Expo push token of the reviewer
        business_name: Name of the business that responded
        response_preview: Preview of the response
        review_id: ID of the review

    Returns:
        Notification send result
    """
    return await notification_service.send_notification(
        push_token=reviewer_push_token,
        title=f"{business_name} responded to your review",
        body=response_preview[:100],
        data={
            "type": NotificationType.REVIEW_RESPONSE,
            "review_id": review_id,
            "business_name": business_name,
        },
        sound="default",
        priority="normal",
        channel_id="reviews",
    )


# ============================================================================
# Cleanup
# ============================================================================

async def cleanup_notification_service():
    """Close notification service session (call on app shutdown)."""
    await notification_service.close()
