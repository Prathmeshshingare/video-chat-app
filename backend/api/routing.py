from django.urls import re_path
from .consumers import CallConsumer
from .consumers_stt import STTConsumer

websocket_urlpatterns = [
    # WebRTC video call signaling
    re_path(r"ws/call/(?P<room_id>\w+)/$", CallConsumer.as_asgi()),
    
    # Speech-to-Text - Django connects to Deepgram
    re_path(r"ws/stt/(?P<room_id>\w+)/$", STTConsumer.as_asgi()),
]