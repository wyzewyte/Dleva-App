"""
Phase 7: Real-Time Infrastructure Service
Handles location broadcasting, order updates, and WebSocket messaging
"""

import logging
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import datetime

logger = logging.getLogger(__name__)


class RealtimeService:
    """
    Service for real-time updates via WebSockets
    Handles location broadcasts, order status updates, notifications
    """
    
    @staticmethod
    def broadcast_rider_location(order_id, rider_id, latitude, longitude, accuracy):
        """
        Broadcast rider location to buyer and admin
        Called when rider sends location update
        """
        try:
            channel_layer = get_channel_layer()
            
            # Broadcast to buyer viewing this order
            async_to_sync(channel_layer.group_send)(
                f'order_buyer_{order_id}',
                {
                    'type': 'location_update',
                    'rider_id': rider_id,
                    'latitude': latitude,
                    'longitude': longitude,
                    'accuracy': accuracy,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            
            # Broadcast to admin dashboard
            async_to_sync(channel_layer.group_send)(
                'admin_dashboard',
                {
                    'type': 'location_update',
                    'order_id': order_id,
                    'rider_id': rider_id,
                    'latitude': latitude,
                    'longitude': longitude,
                    'accuracy': accuracy,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            
            logger.info(f"Location broadcasted for order {order_id}")
        
        except Exception as e:
            logger.error(f"Error broadcasting location: {str(e)}")
    
    @staticmethod
    def broadcast_order_status(order_id, status, message=''):
        """
        Broadcast order status change to all participants
        Called in delivery lifecycle when status changes
        """
        try:
            channel_layer = get_channel_layer()
            
            # Broadcast to order status subscribers
            async_to_sync(channel_layer.group_send)(
                f'order_updates_{order_id}',
                {
                    'type': 'order_status_update',
                    'order_id': order_id,
                    'status': status,
                    'timestamp': timezone.now().isoformat(),
                    'message': message,
                }
            )
            
            # Broadcast to admin dashboard
            async_to_sync(channel_layer.group_send)(
                'admin_dashboard',
                {
                    'type': 'status_update',
                    'order_id': order_id,
                    'status': status,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            
            logger.info(f"Order {order_id} status updated to {status}")
        
        except Exception as e:
            logger.error(f"Error broadcasting order status: {str(e)}")
    
    @staticmethod
    def broadcast_new_available_order(order):
        """
        Broadcast a new available order to all eligible riders
        Called when an order status changes to 'available_for_pickup'
        """
        try:
            channel_layer = get_channel_layer()
            
            # Count items
            items_count = order.items.count()
            
            # Data for broadcast
            broadcast_data = {
                'type': 'new_order',
                'order_id': order.id,
                'restaurant_id': order.restaurant.id,
                'restaurant_name': order.restaurant.name,
                'pickup_address': order.restaurant.address,
                'delivery_address': order.delivery_address,
                'distance_km': float(order.distance_km or 0),
                'estimated_earnings': float(order.rider_earning or 0),
                'urgency': 'urgent' if order.status == 'available_for_pickup' else 'normal',
                'items_count': items_count,
                'timestamp': timezone.now().isoformat(),
            }
            
            # Send to rider_orders_broadcast group
            async_to_sync(channel_layer.group_send)(
                'rider_orders_broadcast',
                broadcast_data
            )
            
            logger.info(f"📢 New available order {order.id} broadcasted to all riders")
        
        except Exception as e:
            logger.error(f"Error broadcasting new order: {str(e)}")

    @staticmethod
    def notify_rider_assignment(rider_id, order_id, order_data):
        """
        Send assignment notification to rider with sound
        Called in Phase 3: Assignment when order assigned to rider
        """
        try:
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                f'notifications_rider_{rider_id}',
                {
                    'type': 'send_notification',
                    'notification_type': 'assignment',
                    'title': 'New Order Assigned',
                    'message': f'New delivery: {order_data.get("restaurant")}',
                    'data': {
                        'order_id': order_id,
                        'restaurant': order_data.get('restaurant'),
                        'amount': order_data.get('amount'),
                        'address': order_data.get('address'),
                    },
                    'sound': True,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            
            logger.info(f"Assignment notification sent to rider {rider_id}")
        
        except Exception as e:
            logger.error(f"Error notifying rider: {str(e)}")
    
    @staticmethod
    def update_admin_dashboard():
        """
        Update admin dashboard with live statistics
        Called periodically to show:
        - Active deliveries count
        - Waiting assignments count
        - Online riders count
        """
        try:
            from buyer.models import Order
            from rider.models import RiderProfile
            
            # Get statistics
            active_deliveries = Order.objects.filter(
                status__in=['assigned', 'arrived_at_pickup', 'released_by_seller', 'picked_up', 'on_the_way']
            ).count()
            
            waiting_assignments = Order.objects.filter(
                status__in=['confirming', 'preparing']
            ).count()
            
            online_riders = RiderProfile.objects.filter(
                is_online=True,
                account_status='approved'
            ).count()
            
            # Broadcast to admin dashboard
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'admin_dashboard',
                {
                    'type': 'dashboard_stats',
                    'active_deliveries': active_deliveries,
                    'waiting_assignments': waiting_assignments,
                    'online_riders': online_riders,
                    'timestamp': timezone.now().isoformat(),
                }
            )
            
            logger.debug(f"Dashboard stats: {active_deliveries} active, {waiting_assignments} waiting")
        
        except Exception as e:
            logger.error(f"Error updating dashboard: {str(e)}")
    
    @staticmethod
    def mark_rider_offline(rider_id):
        """
        Mark rider as offline in real-time system
        Called when rider disconnects or request it
        """
        try:
            from rider.models import RiderProfile, RiderLocation
            
            rider = RiderProfile.objects.get(id=rider_id)
            rider.is_online = False
            rider.save()
            
            # Stop location tracking
            location = RiderLocation.objects.filter(rider=rider).first()
            if location:
                location.is_tracking = False
                location.save()
            
            # Notify admin dashboard
            RealtimeService.update_admin_dashboard()
            
            logger.info(f"Rider {rider_id} marked offline")
        
        except Exception as e:
            logger.error(f"Error marking rider offline: {str(e)}")
    
    @staticmethod
    def mark_rider_online(rider_id):
        """
        Mark rider as online in real-time system
        Called when rider toggles online status
        """
        try:
            from rider.models import RiderProfile, RiderLocation
            
            rider = RiderProfile.objects.get(id=rider_id)
            rider.is_online = True
            rider.save()
            
            # Start location tracking (if not active delivery)
            location, created = RiderLocation.objects.get_or_create(rider=rider)
            location.is_tracking = True
            location.save()
            
            # Notify admin dashboard
            RealtimeService.update_admin_dashboard()
            
            logger.info(f"Rider {rider_id} marked online")
        
        except Exception as e:
            logger.error(f"Error marking rider online: {str(e)}")
    
    @staticmethod
    def add_buyer_to_order_group(user_id, order_id):
        """
        Add buyer to order updates group
        Called when buyer opens order tracking
        """
        try:
            channel_layer = get_channel_layer()
            # Note: This is typically done in the consumer's connect method
            logger.debug(f"Buyer {user_id} added to order {order_id} group")
        except Exception as e:
            logger.error(f"Error adding buyer to group: {str(e)}")
    
    @staticmethod
    def remove_buyer_from_order_group(user_id, order_id):
        """
        Remove buyer from order updates group
        Called when buyer closes order tracking
        """
        try:
            channel_layer = get_channel_layer()
            # Note: This is typically done in the consumer's disconnect method
            logger.debug(f"Buyer {user_id} removed from order {order_id} group")
        except Exception as e:
            logger.error(f"Error removing buyer from group: {str(e)}")
