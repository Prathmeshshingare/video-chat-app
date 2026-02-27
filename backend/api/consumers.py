import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):
    """
    Handles WebRTC signaling for video calls.

    Messages handled:
    - register_role
    - offer
    - answer
    - ice
    - chat
    """

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"call_{self.room_id}"
        self.role = None

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ Connected to room: {self.room_id}")

        # Notify others that someone joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_joined",
                "sender_channel": self.channel_name,
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"❌ Disconnected from room: {self.room_id}")

    async def receive(self, text_data):
        """
        Handle all incoming messages
        """
        data = json.loads(text_data)
        message_type = data.get("type")

        # 1️⃣ Register role
        if message_type == "register_role":
            self.role = data.get("role")
            print(f"🔑 Registered as: {self.role}")
            return

        # 2️⃣ WebRTC signaling
        if message_type in ["offer", "answer", "ice"]:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "webrtc_signal",
                    "message": data,
                    "sender_channel": self.channel_name,
                }
            )
            return

        # 3️⃣ Chat
        if message_type == "chat":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": data["message"],
                    "sender": data["sender"],
                    "id": data["id"],
                    "timestamp": data["timestamp"],
                }
            )
            return

    async def user_joined(self, event):
        # Don't send to self
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps({
            "type": "user-joined"
        }))

    async def webrtc_signal(self, event):
        # Don't send to self
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps(event["message"]))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat",
            "message": event["message"],
            "sender": event["sender"],
            "id": event.get("id"),
            "timestamp": event.get("timestamp"),
        }))