"""
ASGI config for core project with Channels support for Phase 7

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from rider.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Get Django ASGI application
django_asgi_app = get_asgi_application()

# Phase 7: Add Channels routing for WebSockets
# Wrap WebSocket routes with AuthMiddlewareStack so `scope['user']` is populated.
# For development you may choose to relax auth, but in production keep proper auth.
application = ProtocolTypeRouter({
    # HTTP requests go to Django
    'http': django_asgi_app,
    
    # WebSocket requests go to our consumers (with auth middleware)
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

