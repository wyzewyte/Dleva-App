"""
Phase 4: Signals for Real-Time Updates
Automatically broadcasts order status changes and rider location updates to clients
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import logging

from buyer.models import Order
from rider.models import RiderLocation

logger = logging.getLogger(__name__)

channel_layer = get_channel_layer()


@receiver(post_save, sender=Order)
def broadcast_order_status_change(sender, instance, created, update_fields, **kwargs):
    """
    Signal handler: When Order status changes, broadcast to all connected clients
    
    Notifies:
    - Buyer (order group)
    - Seller (order group)
    - Admin dashboard
    """
    # Only trigger on status change
    if update_fields and 'status' not in update_fields:
        return
    
    if created:
        return  # Don't broadcast on creation, only updates
    
    try:
        # Get status display
        status_choices = dict(Order.STATUS_CHOICES)
        status_label = status_choices.get(instance.status, instance.status)
        
        # Message data
        message_data = {
            'type': 'status_update',
            'order_id': instance.id,
            'status': instance.status,
            'status_label': status_label,
            'timestamp': timezone.now().isoformat(),
        }
        
        # Broadcast to order updates group
        async_to_sync(channel_layer.group_send)(
            f'order_updates_{instance.id}',
            message_data
        )
        
        # Broadcast to admin dashboard
        async_to_sync(channel_layer.group_send)(
            'admin_dashboard',
            message_data
        )
        
        logger.info(f"Order {instance.id} status changed to {instance.status}")
        
    except Exception as e:
        logger.error(f"Error broadcasting order status: {str(e)}")


@receiver(post_save, sender=RiderLocation)
def broadcast_rider_location(sender, instance, created, update_fields, **kwargs):
    """
    Signal handler: When RiderLocation is updated, calculate ETA and broadcast
    
    Notifies:
    - Buyer (tracking the order)
    - Seller (tracking the order)
    - Admin dashboard
    """
    try:
        if not instance.current_order or not instance.is_tracking:
            return
        
        # Calculate ETA
        eta_seconds = calculate_eta(instance)
        
        # Message data
        message_data = {
            'type': 'location_update',
            'order_id': instance.current_order.id,
            'rider_id': instance.rider.id,
            'rider_name': instance.rider.full_name,
            'latitude': float(instance.latitude),
            'longitude': float(instance.longitude),
            'accuracy': instance.accuracy,
            'eta_seconds': eta_seconds,
            'timestamp': instance.updated_at.isoformat(),
        }
        
        # Broadcast to order group (buyer & seller)
        async_to_sync(channel_layer.group_send)(
            f'order_updates_{instance.current_order.id}',
            message_data
        )
        
        # Broadcast to admin
        async_to_sync(channel_layer.group_send)(
            'admin_dashboard',
            message_data
        )
        
        logger.debug(f"Location broadcast for order {instance.current_order.id}: ETA {eta_seconds}s")
        
    except Exception as e:
        logger.error(f"Error broadcasting location: {str(e)}")


def calculate_eta(rider_location):
    """
    Calculate ETA in seconds based on rider location and delivery location
    
    Uses Haversine distance formula
    Assumes average speed of 15 km/h for motorcycle
    """
    try:
        from core.models import Location
        from decimal import Decimal
        import math
        
        order = rider_location.current_order
        if not order or not order.delivery_latitude or not order.delivery_longitude:
            return None
        
        # Haversine formula
        lat1 = float(rider_location.latitude)
        lon1 = float(rider_location.longitude)
        lat2 = float(order.delivery_latitude)
        lon2 = float(order.delivery_longitude)
        
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        
        distance_km = R * c
        
        # Average speed: 15 km/h = 4.167 m/s
        avg_speed_kmh = 15
        time_hours = distance_km / avg_speed_kmh
        time_seconds = int(time_hours * 3600)
        
        return max(time_seconds, 60)  # Minimum 1 minute
        
    except Exception as e:
        logger.error(f"Error calculating ETA: {str(e)}")
        return None
