"""
Phase 7: WebSocket Routing Configuration
Maps WebSocket URLs to consumer classes
"""

from django.urls import path, re_path
from rider import consumers

websocket_urlpatterns = [
    # Rider location tracking
    # ws://localhost:8000/ws/rider/location/{rider_id}/
    path('ws/rider/location/<int:rider_id>/', consumers.RiderLocationConsumer.as_asgi()),
    
    # Order status updates
    # ws://localhost:8000/ws/order/status/{order_id}/
    path('ws/order/status/<int:order_id>/', consumers.OrderStatusConsumer.as_asgi()),
    
    # Rider notifications
    # ws://localhost:8000/ws/rider/notifications/{rider_id}/
    path('ws/rider/notifications/<int:rider_id>/', consumers.NotificationConsumer.as_asgi()),
    
    # New orders broadcast to all available riders
    # ws://localhost:8000/ws/rider/orders/
    path('ws/rider/orders/', consumers.RiderOrdersConsumer.as_asgi()),
    
    # Admin live dashboard
    # ws://localhost:8000/ws/admin/dashboard/
    path('ws/admin/dashboard/', consumers.AdminDashboardConsumer.as_asgi()),
]
