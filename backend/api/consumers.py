import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):
    """
    Handles WebRTC signaling for video calls.
    
    Messages handled:
    - register_role: Identify as Doctor/Patient
    - offer: WebRTC offer
    - answer: WebRTC answer
    - ice: ICE candidates
    """

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"call_{self.room_id}"
        self.role = None  # Will be set via register_role

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ Call Consumer connected to room: {self.room_id}")

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
        print(f"❌ Call Consumer disconnected from room: {self.room_id}")

    async def receive(self, text_data):
        """
        Handle incoming messages from WebSocket
        """
        data = json.loads(text_data)

        # Register role (Doctor or Patient)
        if data.get("type") == "register_role":
            self.role = data.get("role")
            print(f"🔑 User registered as: {self.role} in room {self.room_id}")
            return

        # WebRTC signaling (offer, answer, ice)
        if data.get("type") in ["offer", "answer", "ice"]:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "webrtc_signal",
                    "message": data,
                    "sender_channel": self.channel_name,
                }
            )
            return

    async def user_joined(self, event):
        """
        Notify this user that someone joined the room
        """
        # Don't send to self
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps({
            "type": "user-joined"
        }))

    async def webrtc_signal(self, event):
        """
        Forward WebRTC signaling messages
        """
        # Don't send to self
        if self.channel_name == event["sender_channel"]:
            return

        await self.send(text_data=json.dumps(event["message"]))