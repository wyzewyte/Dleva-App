"""
Phase 7: Buyer Push Notification Service
Handles Firebase FCM and in-app notifications for buyers
Similar to rider and seller notifications
"""

import json
import logging
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal
from core.push_notifications import PushNotificationClient

logger = logging.getLogger(__name__)


class BuyerPushNotificationService:
    """
    Manages push notifications for buyers
    
    Supports:
    - WebSocket in-app notifications (immediate)
    - Firebase FCM push notifications (fallback)
    - Database persistence for offline buyers
    """
    
    # Notification types with configuration
    NOTIFICATION_CONFIG = {
        'order_confirmed': {
            'title': 'Order Confirmed',
            'sound': True,
            'priority': 'high',
        },
        'order_processing': {
            'title': 'Order Processing',
            'sound': False,
            'priority': 'normal',
        },
        'order_ready': {
            'title': 'Order Ready for Pickup',
            'sound': True,
            'priority': 'high',
        },
        'rider_assigned': {
            'title': 'Rider Assigned',
            'sound': True,
            'priority': 'high',
        },
        'rider_arrived_at_restaurant': {
            'title': 'Rider Arrived at Restaurant',
            'sound': False,
            'priority': 'normal',
        },
        'order_picked_up': {
            'title': 'Order Picked Up',
            'sound': True,
            'priority': 'high',
        },
        'order_on_the_way': {
            'title': 'Order On The Way',
            'sound': True,
            'priority': 'high',
        },
        'delivery_attempted': {
            'title': 'Delivery Attempted',
            'sound': False,
            'priority': 'normal',
        },
        'order_delivered': {
            'title': 'Order Delivered',
            'sound': True,
            'priority': 'high',
        },
        'promotion': {
            'title': 'Special Promotion',
            'sound': False,
            'priority': 'low',
        },
        'payment_failed': {
            'title': 'Payment Failed',
            'sound': True,
            'priority': 'high',
        },
        'support': {
            'title': 'Support Message',
            'sound': False,
            'priority': 'normal',
        },
    }
    
    @staticmethod
    def send_order_confirmed(order, buyer_id):
        """
        Send notification when order confirmed by seller
        """
        message = f"Your order has been confirmed. Est. time: 30 mins"
        data = {
            'order_id': order.id,
            'restaurant': order.restaurant.name,
            'total_price': str(order.total_price),
        }
        
        BuyerPushNotificationService.send_notification(
            buyer_id=buyer_id,
            notification_type='order_confirmed',
            title='Order Confirmed',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_order_ready(order, buyer_id):
        """
        Send notification when order ready for pickup
        """
        message = f"Your order is ready for pickup!"
        data = {
            'order_id': order.id,
            'restaurant': order.restaurant.name,
        }
        
        BuyerPushNotificationService.send_notification(
            buyer_id=buyer_id,
            notification_type='order_ready',
            title='Order Ready',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_order_on_delivery(order, rider, buyer_id):
        """
        Send notification when order on delivery
        """
        message = f"Your order is on the way with {rider.full_name}"
        data = {
            'order_id': order.id,
            'rider_name': rider.full_name,
        }
        
        BuyerPushNotificationService.send_notification(
            buyer_id=buyer_id,
            notification_type='order_on_the_way',
            title='Order on Delivery',
            message=message,
            data=data,
            order_id=order.id,
        )
    
    @staticmethod
    def send_order_delivered(order, buyer_id):
        """
        Send notification when order delivered
        """
        message = f"Order delivered! Rate your experience"
        data = {
            'order_id': order.id,
            'restaurant': order.restaurant.name,
        }
        
        BuyerPushNotificationService.send_notification(
            buyer_id=buyer_id,
            notification_type='order_delivered',
            title='Order Delivered',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_payment_failed(order, buyer_id, reason=''):
        """
        Send notification when payment failed
        """
        message = f"Payment failed. Please try again. {reason}"
        data = {
            'order_id': order.id,
            'reason': reason,
        }
        
        BuyerPushNotificationService.send_notification(
            buyer_id=buyer_id,
            notification_type='payment_failed',
            title='Payment Failed',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_promotion(title, message, buyer_id=None, data=None):
        """
        Send promotion notification
        """
        BuyerPushNotificationService.send_notification(
            buyer_id=buyer_id,
            notification_type='promotion',
            title=title or 'Special Promotion',
            message=message,
            data=data or {},
            sound=False,
        )
    

    
    @staticmethod
    def send_notification(buyer_id, notification_type, title, message, 
                         data=None, order_id=None, sound=False):
        """
        Core notification sending method
        
        Sends via:
        1. WebSocket (if connected) - instant
        2. Firebase FCM (if token available) - fallback
        3. Database (always) - for history
        """
        from buyer.models import BuyerProfile, BuyerNotification
        
        try:
            # Get buyer
            buyer = BuyerProfile.objects.get(id=buyer_id)
            
            # Save to database
            notification = BuyerNotification.objects.create(
                buyer=buyer,
                notification_type=notification_type,
                title=title,
                message=message,
                related_order_id=order_id,
                data=data or {},
                is_read=False,
            )
            
            # Send via WebSocket (async)
            websocket_sent = BuyerPushNotificationService._send_via_websocket(
                buyer_id=buyer_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {},
                sound=sound,
            )
            
            # Send via FCM (if token available) - for push notifications when app is backgrounded
            fcm_sent = False
            if buyer.fcm_token:
                fcm_sent = BuyerPushNotificationService._send_via_fcm(
                    buyer=buyer,
                    notification=notification,
                    sound=sound,
                )
            
            # Mark as sent only if at least one active delivery channel succeeded.
            notification.is_sent = bool(websocket_sent or fcm_sent)
            if notification.is_sent:
                notification.sent_at = timezone.now()
            notification.save()
            
            logger.info(f"Notification sent to buyer {buyer_id}: {notification_type}")
            
            return notification
        
        except BuyerProfile.DoesNotExist:
            logger.error(f"Buyer {buyer_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return None
    
    @staticmethod
    def _send_via_websocket(buyer_id, notification_type, title, message, data, sound):
        """
        Send notification via WebSocket (instant, if connected)
        """
        try:
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                f'notifications_buyer_{buyer_id}',
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
            return True
        except Exception as e:
            logger.warning(f"WebSocket notification failed: {str(e)}")
            return False
    
    @staticmethod
    def _send_via_fcm(buyer, notification, sound):
        """
        Send push notification via Firebase Cloud Messaging
        For backgrounded/offline buyers who aren't connected via WebSocket
        """
        try:
            message_data = {
                'notification_type': notification.notification_type,
                'order_id': str(notification.related_order_id) if notification.related_order_id else '',
                'title': notification.title,
                'user_role': 'buyer',  # ✅ Add user role for Service Worker routing
            }

            if notification.data:
                message_data.update(notification.data)

            sent = PushNotificationClient.send(
                token=buyer.fcm_token,
                title=notification.title,
                body=notification.message,
                data=message_data,
                sound=sound,
            )

            if sent:
                logger.info("FCM notification sent to buyer %s", buyer.user.username)
            return sent

        except Exception as e:
            logger.error(f"FCM notification failed for buyer {buyer.id}: {str(e)}")
            return False
