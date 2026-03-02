import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):
    """
    Handles:
    - WebRTC signaling (offer, answer, ice)
    - Chat messages
    - Read receipts
    - User join notification
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

        # Notify others someone joined
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

        # 3️⃣ Chat message
        if message_type == "chat":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": data.get("message"),
                    "sender": data.get("sender"),
                    "id": data.get("id"),
                    "timestamp": data.get("timestamp"),
                }
            )
            return

        # 4️⃣ Read receipt
        if message_type == "read-receipt":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "read_receipt",
                    "id": data.get("id"),
                    "sender_channel": self.channel_name,
                }
            )
            return

    # 🔹 USER JOINED EVENT
    async def user_joined(self, event):
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps({
            "type": "user-joined"
        }))

    # 🔹 WEBRTC SIGNAL EVENT
    async def webrtc_signal(self, event):
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps(event["message"]))

    # 🔹 CHAT MESSAGE EVENT
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat",
            "message": event.get("message"),
            "sender": event.get("sender"),
            "id": event.get("id"),
            "timestamp": event.get("timestamp"),
        }))

    # 🔹 READ RECEIPT EVENT
    async def read_receipt(self, event):
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps({
            "type": "read-receipt",
            "id": event.get("id"),
        }))