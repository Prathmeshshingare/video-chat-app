import json
import asyncio
import websockets
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings


class STTConsumer(AsyncWebsocketConsumer):
    """
    STT Consumer - Django Gateway to Deepgram
    
    Architecture:
    React → Django STT Gateway → Deepgram API
    
    Flow:
    1. React sends audio bytes to this consumer
    2. This consumer forwards to Deepgram
    3. Deepgram returns transcript
    4. This consumer broadcasts transcript to room
    """

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"stt_{self.room_id}"
        self.role = None  # Will be set by register_role message
        self.deepgram_ws = None
        self.deepgram_listener = None

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ STT Consumer connected to room: {self.room_id}")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Close Deepgram connection
        if self.deepgram_ws:
            try:
                await self.deepgram_ws.close()
            except Exception as e:
                print(f"Error closing Deepgram: {e}")
        
        if self.deepgram_listener:
            self.deepgram_listener.cancel()
        
        print(f"❌ STT Consumer disconnected from room: {self.room_id}")

    async def receive(self, text_data=None, bytes_data=None):
        """
        Receive from React client
        - text_data: JSON messages (e.g., register_role)
        - bytes_data: Audio chunks to forward to Deepgram
        """
        
        # Handle JSON messages
        if text_data:
            try:
                data = json.loads(text_data)
                
                # Register user role (Doctor or Patient)
                if data.get("type") == "register_role":
                    self.role = data.get("role")
                    print(f"🔑 Registered as {self.role} in room {self.room_id}")
                    
                    # Connect to Deepgram after role registration
                    await self.connect_to_deepgram()
                    return
                    
            except json.JSONDecodeError:
                print("⚠️ Invalid JSON received")
                return
        
        # Handle audio bytes - forward to Deepgram
        if bytes_data:
            if self.deepgram_ws and self.deepgram_ws.open:
                try:
                    await self.deepgram_ws.send(bytes_data)
                except Exception as e:
                    print(f"❌ Error sending to Deepgram: {e}")

    async def connect_to_deepgram(self):
        """
        Connect to Deepgram API
        """
        deepgram_url = (
            "wss://api.deepgram.com/v1/listen"
            "?model=nova-2"
            "&punctuate=true"
            "&interim_results=false"
            "&encoding=linear16"
            "&sample_rate=16000"
        )
        
        try:
            self.deepgram_ws = await websockets.connect(
                deepgram_url,
                extra_headers={
                    "Authorization": f"Token {settings.DEEPGRAM_API_KEY}"
                }
            )
            print(f"✅ Deepgram connected for {self.role} in room: {self.room_id}")
            
            # Start listening to Deepgram responses
            self.deepgram_listener = asyncio.create_task(
                self.listen_to_deepgram()
            )
            
        except Exception as e:
            print(f"❌ Deepgram connection error: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Failed to connect to speech service"
            }))

    async def listen_to_deepgram(self):
        """
        Listen for transcripts from Deepgram and broadcast to room
        """
        try:
            async for message in self.deepgram_ws:
                data = json.loads(message)
                
                # Extract transcript
                if "channel" in data:
                    alternatives = data["channel"].get("alternatives", [])
                    if alternatives and len(alternatives) > 0:
                        transcript = alternatives[0].get("transcript", "").strip()
                        
                        # Only broadcast non-empty final transcripts
                        if transcript and self.role:
                            await self.channel_layer.group_send(
                                self.room_group_name,
                                {
                                    "type": "broadcast_transcript",
                                    "speaker": self.role,
                                    "text": transcript
                                }
                            )
                            print(f"📝 {self.role}: {transcript}")
                            
        except websockets.exceptions.ConnectionClosed:
            print(f"⚠️ Deepgram connection closed for {self.role}")
        except Exception as e:
            print(f"❌ Error in Deepgram listener: {e}")

    async def broadcast_transcript(self, event):
        """
        Send transcript to WebSocket client
        """
        await self.send(text_data=json.dumps({
            "type": "transcript",
            "speaker": event["speaker"],
            "text": event["text"]
        }))