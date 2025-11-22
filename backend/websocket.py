"""
WebSocket Support for Real-Time Messaging

Implements WebSocket connections for real-time chat between patrons and vendors
"""

from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List, Optional
import json
from datetime import datetime
from sqlalchemy.orm import Session

from .auth import verify_token, TokenPayload
from .database import get_db, User
from .notifications import notify_new_message


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging."""

    def __init__(self):
        # Active connections: {user_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a new WebSocket connection."""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        print(f"✅ User {user_id} connected. Active connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)

            # Clean up if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        print(f"❌ User {user_id} disconnected. Remaining: {len(self.active_connections.get(user_id, []))}")

    async def send_personal_message(self, message: dict, user_id: int) -> bool:
        """
        Send a message to a specific user (all their connections).

        Returns:
            True if message was delivered to at least one connection, False otherwise
        """
        if user_id in self.active_connections:
            disconnected = []
            delivered = False

            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    delivered = True
                except:
                    # Connection is dead, mark for removal
                    disconnected.append(connection)

            # Clean up dead connections
            for connection in disconnected:
                self.disconnect(connection, user_id)

            return delivered

        return False

    def is_user_online(self, user_id: int) -> bool:
        """Check if a user has any active WebSocket connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def broadcast(self, message: dict, user_ids: List[int]):
        """Send a message to multiple users."""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)


# Global connection manager
manager = ConnectionManager()


# WebSocket endpoint
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session):
    """
    WebSocket endpoint for real-time messaging.

    Connect: ws://localhost:8000/ws/messages?token=<access_token>
    """
    try:
        # Verify token
        payload = verify_token(token)
        user_id = payload.user_id

        # Get sender info
        sender = db.query(User).filter(User.id == user_id).first()
        sender_name = f"{sender.first_name} {sender.last_name}" if sender else "User"

        # Accept connection
        await manager.connect(websocket, user_id)

        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)

                # Extract message details
                to_user_id = message_data.get("to_user_id")
                text = message_data.get("text")
                message_type = message_data.get("type", "text")

                # Create message object
                message = {
                    "id": f"msg_{datetime.utcnow().timestamp()}",
                    "from_user_id": user_id,
                    "to_user_id": to_user_id,
                    "text": text,
                    "type": message_type,
                    "timestamp": datetime.utcnow().isoformat(),
                }

                # TODO: Save message to database
                # await save_message_to_db(message)

                # Send to recipient via WebSocket
                delivered = await manager.send_personal_message(message, to_user_id)

                # If recipient is offline, send push notification
                if not delivered and message_type == "text":
                    # Get recipient info
                    recipient = db.query(User).filter(User.id == to_user_id).first()

                    if recipient and recipient.expo_push_token and recipient.notifications_messages:
                        # Send push notification
                        try:
                            conversation_id = min(user_id, to_user_id) * 10000 + max(user_id, to_user_id)
                            await notify_new_message(
                                recipient_push_token=recipient.expo_push_token,
                                sender_name=sender_name,
                                message_preview=text,
                                conversation_id=conversation_id,
                            )
                            print(f"📱 Push notification sent to user {to_user_id} (offline)")
                        except Exception as e:
                            print(f"Failed to send push notification: {e}")

                # Send confirmation back to sender
                await manager.send_personal_message(
                    {**message, "status": "sent", "delivered_via_push": not delivered},
                    user_id
                )

        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
        except Exception as e:
            print(f"Error in WebSocket: {e}")
            manager.disconnect(websocket, user_id)

    except Exception as e:
        print(f"Authentication error in WebSocket: {e}")
        await websocket.close(code=1008)  # Policy violation


# Typing indicator
async def send_typing_indicator(user_id: int, to_user_id: int, is_typing: bool):
    """Send typing indicator to another user."""
    message = {
        "type": "typing",
        "from_user_id": user_id,
        "is_typing": is_typing,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await manager.send_personal_message(message, to_user_id)


# Read receipts
async def send_read_receipt(user_id: int, message_id: str, to_user_id: int):
    """Send read receipt for a message."""
    receipt = {
        "type": "read_receipt",
        "message_id": message_id,
        "read_by": user_id,
        "timestamp": datetime.utcnow().isoformat(),
    }

    await manager.send_personal_message(receipt, to_user_id)
