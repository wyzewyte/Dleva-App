"""
Phase 7: Push Notification Service
Handles Firebase FCM and in-app notifications
"""

import json
import logging
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal
from core.push_notifications import PushNotificationClient


logger = logging.getLogger(__name__)


class PushNotificationService:
    """
    Manages push notifications for riders
    
    Supports:
    - WebSocket in-app notifications (immediate)
    - Firebase FCM push notifications (fallback)
    - Database persistence for offline riders
    """
    
    # Notification types with icons and sounds
    NOTIFICATION_CONFIG = {
        'assignment': {
            'title': 'New Order Assigned',
            'sound': True,
            'priority': 'high',
        },
        'pickup': {
            'title': 'Order Picked Up',
            'sound': False,
            'priority': 'normal',
        },
        'delivery': {
            'title': 'Order Delivered',
            'sound': False,
            'priority': 'normal',
        },
        'payout': {
            'title': 'Payout Approved',
            'sound': True,
            'priority': 'high',
        },
        'disputed': {
            'title': 'Order Dispute',
            'sound': True,
            'priority': 'high',
        },
        'suspension': {
            'title': 'Account Suspension',
            'sound': True,
            'priority': 'high',
        },
        'warning': {
            'title': 'Performance Warning',
            'sound': False,
            'priority': 'normal',
        },
    }
    
    @staticmethod
    def send_order_assigned(order, rider_id):
        """
        Send notification when order assigned to rider
        Used in Phase 3: Assignment
        """
        message = f"New delivery: {order.restaurant.name} → {order.delivery_address}"
        data = {
            'order_id': order.id,
            'restaurant': order.restaurant.name,
            'amount': str(order.total_price),
            'address': order.delivery_address,
        }
        
        PushNotificationService.send_notification(
            rider_id=rider_id,
            notification_type='assignment',
            title='New Order Assigned',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_order_status_update(order, status, rider_id=None):
        """
        Send notification when order status changes
        Used in Phase 4: Delivery
        """
        status_messages = {
            'assigned': f'Order assigned to {order.rider.full_name}',
            'arrived': 'Rider arrived at restaurant',
            'released': 'Order released for pickup',
            'picked_up': 'Order picked up',
            'on_the_way': 'Order on the way',
            'delivered': 'Order delivered',
            'cancelled': 'Order cancelled',
        }
        
        message = status_messages.get(status, f'Status: {status}')
        
        # Send to rider (if provided)
        if rider_id:
            PushNotificationService.send_notification(
                rider_id=rider_id,
                notification_type='status_update',
                title=f'Order Status: {status}',
                message=message,
                data={'order_id': order.id, 'status': status},
                order_id=order.id,
            )
    
    @staticmethod
    def send_payout_approved(rider_id, payout_amount):
        """
        Send notification when payout approved
        Used in Phase 5: Payouts
        """
        message = f'Payout of ₱{payout_amount:.2f} has been approved'
        data = {
            'amount': str(payout_amount),
            'type': 'payout_approved',
        }
        
        PushNotificationService.send_notification(
            rider_id=rider_id,
            notification_type='payout',
            title='Payout Approved',
            message=message,
            data=data,
            sound=True,
        )
    
    @staticmethod
    def send_dispute_notification(rider_id, order_id, dispute_id):
        """
        Send notification when dispute filed
        Used in Phase 5: Disputes
        """
        message = f'Dispute filed for order #{order_id}'
        data = {
            'order_id': order_id,
            'dispute_id': dispute_id,
        }
        
        PushNotificationService.send_notification(
            rider_id=rider_id,
            notification_type='disputed',
            title='Order Dispute',
            message=message,
            data=data,
            order_id=order_id,
            sound=True,
        )
    
    @staticmethod
    def send_suspension_warning(rider_id, rating):
        """
        Send warning when rating drops below threshold
        Used in Phase 6: Ratings
        """
        message = f'Your rating is below 1.5 ({rating:.2f}). You have 7 days to improve.'
        data = {
            'rating': str(rating),
            'type': 'warning',
        }
        
        PushNotificationService.send_notification(
            rider_id=rider_id,
            notification_type='warning',
            title='Performance Warning',
            message=message,
            data=data,
        )
    
    @staticmethod
    def send_suspended_notice(rider_id):
        """
        Send notice when account suspended
        Used in Phase 6: Ratings
        """
        message = 'Your account has been suspended for 7 days due to low ratings.'
        
        PushNotificationService.send_notification(
            rider_id=rider_id,
            notification_type='suspension',
            title='Account Suspended',
            message=message,
            data={'type': 'suspended'},
            sound=True,
        )
    

    
    @staticmethod
    def send_notification(rider_id, notification_type, title, message, 
                         data=None, order_id=None, sound=False):
        """
        Core notification sending method
        
        Sends via:
        1. WebSocket (if connected) - instant
        2. Firebase FCM (if token available) - fallback
        3. Database (always) - for history
        """
        from rider.models import RiderProfile, RiderNotification
        
        try:
            # Get rider
            rider = RiderProfile.objects.get(id=rider_id)
            
            # Save to database
            notification = RiderNotification.objects.create(
                rider=rider,
                notification_type=notification_type,
                title=title,
                message=message,
                related_order_id=order_id,
                data=data or {},
                is_sent=False,
            )
            
            # Send via WebSocket (async)
            PushNotificationService._send_via_websocket(
                rider_id=rider_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {},
                sound=sound,
            )
            
            # Send via FCM (if token available) - for push notifications when app is backgrounded
            if rider.fcm_token:
                PushNotificationService._send_via_fcm(
                    rider=rider,
                    notification=notification,
                    sound=sound,
                )
            
            # Mark as sent
            notification.is_sent = True
            notification.sent_at = timezone.now()
            notification.save()
            
            logger.info(f"Notification sent to rider {rider_id}: {notification_type}")
            
            return notification
        
        except RiderProfile.DoesNotExist:
            logger.error(f"Rider {rider_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return None
    
    @staticmethod
    def _send_via_websocket(rider_id, notification_type, title, message, data, sound):
        """
        Send notification via WebSocket (instant, if connected)
        """
        try:
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                f'notifications_rider_{rider_id}',
                {
                    'type': 'send_notification',
                    'notification_type': notification_type,
                    'title': title,
                    'message': message,
                    'data': data,
                    'sound': sound,
                    'timestamp': timezone.now().isoformat(),
                }
            )
        except Exception as e:
            logger.warning(f"WebSocket notification failed: {str(e)}")
    
    @staticmethod
    def _send_via_fcm(rider, notification, sound):
        """
        Send push notification via Firebase Cloud Messaging
        For backgrounded/offline riders who aren't connected via WebSocket
        """
        try:
            message_data = {
                'notification_type': notification.notification_type,
                'order_id': str(notification.related_order_id) if notification.related_order_id else '',
                'title': notification.title,
            }

            if notification.data:
                message_data.update(notification.data)

            sent = PushNotificationClient.send(
                token=rider.fcm_token,
                title=notification.title,
                body=notification.message,
                data=message_data,
                sound=sound,
            )

            if sent:
                logger.info("FCM notification sent to rider %s", rider.full_name)

        except Exception as e:
            logger.error(f"FCM notification failed for rider {rider.id}: {str(e)}")
    
    @staticmethod
    def broadcast_to_order_participants(order_id, event_type, data):
        """
        Broadcast event to all participants of an order:
        - Buyer
        - Seller
        - Rider
        - Admin
        """
        try:
            channel_layer = get_channel_layer()
            
            # Broadcast to order status viewers
            async_to_sync(channel_layer.group_send)(
                f'order_updates_{order_id}',
                {
                    'type': 'order_status_update',
                    'order_id': order_id,
                    'status': data.get('status'),
                    'timestamp': timezone.now().isoformat(),
                    'message': data.get('message', ''),
                }
            )
            
            # Broadcast to admin dashboard
            async_to_sync(channel_layer.group_send)(
                'admin_dashboard',
                {
                    'type': 'status_update',
                    'order_id': order_id,
                    'status': data.get('status'),
                    'timestamp': timezone.now().isoformat(),
                }
            )
        
        except Exception as e:
            logger.error(f"Error broadcasting order event: {str(e)}")
    
    @staticmethod
    def mark_as_read(notification_id):
        """Mark notification as read"""
        from rider.models import RiderNotification
        
        try:
            notification = RiderNotification.objects.get(id=notification_id)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
        except RiderNotification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found")
    
    @staticmethod
    def get_unread_count(rider_id):
        """Get count of unread notifications"""
        from rider.models import RiderNotification
        
        return RiderNotification.objects.filter(
            rider_id=rider_id,
            is_read=False
        ).count()
    
    @staticmethod
    def get_recent_notifications(rider_id, limit=10):
        """Get recent notifications for rider"""
        from rider.models import RiderNotification
        
        return RiderNotification.objects.filter(
            rider_id=rider_id
        ).order_by('-created_at')[:limit]
    

