"""
Phase 7: Seller Push Notification Service
Handles Firebase FCM and in-app notifications for sellers
Similar to rider notifications but for seller events
"""

import json
import logging
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal

logger = logging.getLogger(__name__)


class SellerPushNotificationService:
    """
    Manages push notifications for sellers
    
    Supports:
    - WebSocket in-app notifications (immediate)
    - Firebase FCM push notifications (fallback)
    - Database persistence for offline sellers
    """
    
    # Notification types with configuration
    NOTIFICATION_CONFIG = {
        'new_order': {
            'title': 'New Order Received',
            'sound': True,
            'priority': 'high',
        },
        'order_ready': {
            'title': 'Order Ready for Pickup',
            'sound': False,
            'priority': 'normal',
        },
        'order_cancelled': {
            'title': 'Order Cancelled',
            'sound': True,
            'priority': 'high',
        },
        'delivery_assigned': {
            'title': 'Delivery Assigned',
            'sound': False,
            'priority': 'normal',
        },
        'payout_approved': {
            'title': 'Payout Approved',
            'sound': True,
            'priority': 'high',
        },
        'new_review': {
            'title': 'New Review Received',
            'sound': False,
            'priority': 'normal',
        },
        'order_update': {
            'title': 'Order Status Update',
            'sound': False,
            'priority': 'normal',
        },
        'system_alert': {
            'title': 'System Alert',
            'sound': True,
            'priority': 'high',
        },
    }
    
    @staticmethod
    def send_new_order(order, seller_id):
        """
        Send notification when new order received
        """
        from seller.models import SellerProfile
        
        try:
            seller = SellerProfile.objects.get(id=seller_id)
        except SellerProfile.DoesNotExist:
            logger.error(f"Seller {seller_id} not found")
            return None
        
        # Format order summary
        items_count = order.items.count()
        message = f"New order from {order.buyer.user.first_name or 'Customer'} - {items_count} items • ₦{order.total_price}"
        
        data = {
            'order_id': order.id,
            'buyer_name': order.buyer.user.first_name or 'Customer',
            'items_count': items_count,
            'total_price': str(order.total_price),
            'delivery_address': order.delivery_address,
        }
        
        SellerPushNotificationService.send_notification(
            seller_id=seller_id,
            notification_type='new_order',
            title='🆕 New Order Received',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_order_cancelled(order, seller_id, reason='Customer cancelled'):
        """
        Send notification when order is cancelled
        """
        message = f"Order #{order.id} cancelled - {reason}"
        data = {
            'order_id': order.id,
            'reason': reason,
        }
        
        SellerPushNotificationService.send_notification(
            seller_id=seller_id,
            notification_type='order_cancelled',
            title='❌ Order Cancelled',
            message=message,
            data=data,
            order_id=order.id,
            sound=True,
        )
    
    @staticmethod
    def send_delivery_assigned(order, rider_name, seller_id):
        """
        Send notification when rider accepts order and picks it up
        """
        message = f"Order #{order.id} picked up by {rider_name}"
        data = {
            'order_id': order.id,
            'rider_name': rider_name,
        }
        
        SellerPushNotificationService.send_notification(
            seller_id=seller_id,
            notification_type='delivery_assigned',
            title='🚴 Order Picked Up',
            message=message,
            data=data,
            order_id=order.id,
        )
    
    @staticmethod
    def send_payout_approved(seller_id, payout_amount):
        """
        Send notification when payout approved
        """
        message = f'Payout of ₦{payout_amount:.2f} has been approved'
        data = {
            'amount': str(payout_amount),
            'type': 'payout_approved',
        }
        
        SellerPushNotificationService.send_notification(
            seller_id=seller_id,
            notification_type='payout_approved',
            title='💰 Payout Approved',
            message=message,
            data=data,
            sound=True,
        )
    
    @staticmethod
    def send_new_review(seller_id, rating, review_text, buyer_name='Customer'):
        """
        Send notification when new review received
        """
        message = f"New {rating}⭐ review from {buyer_name}: \"{review_text[:50]}...\""
        data = {
            'rating': str(rating),
            'buyer_name': buyer_name,
            'review_text': review_text,
        }
        
        SellerPushNotificationService.send_notification(
            seller_id=seller_id,
            notification_type='new_review',
            title='⭐ New Review',
            message=message,
            data=data,
        )
    
    @staticmethod
    def send_notification(seller_id, notification_type, title, message, 
                         data=None, order_id=None, sound=False):
        """
        Core notification sending method
        
        Sends via:
        1. WebSocket (if connected) - instant
        2. Firebase FCM (if token available) - fallback
        3. Database (always) - for history
        """
        from seller.models import SellerProfile, SellerNotification
        
        try:
            # Get seller
            seller = SellerProfile.objects.get(id=seller_id)
            
            # Save to database
            notification = SellerNotification.objects.create(
                seller=seller,
                notification_type=notification_type,
                title=title,
                message=message,
                related_order_id=order_id,
                data=data or {},
                is_sent=False,
            )
            
            # Send via WebSocket (async)
            SellerPushNotificationService._send_via_websocket(
                seller_id=seller_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {},
                sound=sound,
            )
            
            # Send via FCM (if token available) - for push notifications when app is backgrounded
            if seller.fcm_token:
                SellerPushNotificationService._send_via_fcm(
                    seller=seller,
                    notification=notification,
                    sound=sound,
                )
            
            # Mark as sent
            notification.is_sent = True
            notification.sent_at = timezone.now()
            notification.save()
            
            logger.info(f"Notification sent to seller {seller_id}: {notification_type}")
            
            return notification
        
        except SellerProfile.DoesNotExist:
            logger.error(f"Seller {seller_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return None
    
    @staticmethod
    def _send_via_websocket(seller_id, notification_type, title, message, data, sound):
        """
        Send notification via WebSocket (instant, if connected)
        """
        try:
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                f'notifications_seller_{seller_id}',
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
    def _send_via_fcm(seller, notification, sound):
        """
        Send push notification via Firebase Cloud Messaging
        For backgrounded/offline sellers
        """
        try:
            # Firebase FCM integration for push notifications
            try:
                import firebase_admin
                from firebase_admin import messaging
            except ImportError:
                logger.warning(f"firebase-admin not installed. Install with: pip install firebase-admin")
                return
            
            # Check if Firebase is initialized
            if not firebase_admin._apps:
                try:
                    from firebase_admin import credentials
                    cred = credentials.Certificate('serviceAccountKey.json')
                    firebase_admin.initialize_app(cred)
                except FileNotFoundError:
                    logger.warning("serviceAccountKey.json not found. FCM will not work.")
                    return
                except Exception as e:
                    logger.error(f"Failed to initialize Firebase: {str(e)}")
                    return
            
            # Build message with data payload
            message_data = {
                'notification_type': notification.notification_type,
                'order_id': str(notification.related_order_id) if notification.related_order_id else '',
                'title': notification.title,
            }
            
            # Add any additional data
            if notification.data:
                message_data.update(notification.data)
            
            # Create FCM message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification.title,
                    body=notification.message,
                ),
                data=message_data,
                token=seller.fcm_token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default' if sound else None,
                    ),
                ) if sound else None,
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default' if sound else None,
                            badge='1',
                            content_available=True,
                        )
                    )
                ) if sound else None,
            )
            
            # Send the message
            response = messaging.send(message)
            logger.info(f"FCM notification sent to {seller.restaurant_name}. Response: {response}")
        
        except Exception as e:
            logger.error(f"FCM notification failed for seller {seller.id}: {str(e)}")
    
    @staticmethod
    def mark_as_read(notification_id):
        """Mark notification as read"""
        from seller.models import SellerNotification
        
        try:
            notification = SellerNotification.objects.get(id=notification_id)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
        except SellerNotification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found")
    
    @staticmethod
    def get_unread_count(seller_id):
        """Get count of unread notifications"""
        from seller.models import SellerNotification
        
        return SellerNotification.objects.filter(
            seller_id=seller_id,
            is_read=False
        ).count()
    
    @staticmethod
    def get_recent_notifications(seller_id, limit=10):
        """Get recent notifications for seller"""
        from seller.models import SellerNotification
        
        return SellerNotification.objects.filter(
            seller_id=seller_id
        ).order_by('-created_at')[:limit]
