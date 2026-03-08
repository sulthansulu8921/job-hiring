import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from .channels_middleware import TokenAuthMiddleware
import messages.routing
import notifications.routing

# Initialize Django ASGI application early to ensure settings and apps are loaded
django_asgi_app = get_asgi_application()

from django.urls import re_path
from channels.generic.websocket import AsyncWebsocketConsumer
import json

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware(
        URLRouter(
            messages.routing.websocket_urlpatterns +
            notifications.routing.websocket_urlpatterns
        )
    ),
})
