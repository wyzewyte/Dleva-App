"""
Seller Signals - Phase 7
Triggers notifications when sellers receive new orders
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from buyer.models import Order
from seller.models import SellerProfile
from seller.notification_service import SellerPushNotificationService
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def notify_seller_on_new_order(sender, instance, created, **kwargs):
    """
    When a new order is created, send notification to seller
    
    Triggers:
    - WebSocket notification (instant, if seller connected)
    - FCM push notification (if seller has FCM token)
    - Database persistence (always)
    """
    if created and instance.restaurant and instance.restaurant.seller:
        # Only notify if order is not cancelled
        if instance.status not in ['cancelled', 'rejected']:
            seller = instance.restaurant.seller
            
            try:
                # Send notification to seller
                SellerPushNotificationService.send_new_order(instance, seller.id)
                
                print(f"\n{'='*70}")
                print(f"[NOTIFICATION] 🔔 New Order Alert")
                print(f"Seller: {seller.restaurant_name}")
                print(f"Order #{instance.id}")
                print(f"Customer: {instance.buyer.user.first_name or 'Guest'}")
                print(f"Items: {instance.items.count()}")
                print(f"Total: ₦{instance.total_price}")
                print(f"{'='*70}\n")
                
            except Exception as e:
                logger.error(f"Error sending order notification to seller {seller.id}: {str(e)}")


@receiver(post_save, sender=Order)
def notify_seller_on_order_delivery_assignment(sender, instance, update_fields, **kwargs):
    """
    When an order is assigned to a rider, notify seller
    """
    # Check if rider was just assigned
    if update_fields and 'rider' in update_fields and instance.rider:
        if instance.restaurant and instance.restaurant.seller:
            seller = instance.restaurant.seller
            
            try:
                # Send notification
                SellerPushNotificationService.send_delivery_assigned(
                    instance,
                    instance.rider.full_name,
                    seller.id
                )
                
                print(f"[NOTIFICATION] 🚴 Rider Assigned")
                print(f"Seller: {seller.restaurant_name}")
                print(f"Rider: {instance.rider.full_name}")
                print(f"Order: #{instance.id}")
                
            except Exception as e:
                logger.error(f"Error sending delivery assignment notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_seller_on_order_cancellation(sender, instance, update_fields, **kwargs):
    """
    When an order is cancelled, notify seller
    """
    # Check if status was just changed to cancelled
    if update_fields and 'status' in update_fields and instance.status == 'cancelled':
        if instance.restaurant and instance.restaurant.seller:
            seller = instance.restaurant.seller
            
            try:
                # Send notification
                SellerPushNotificationService.send_order_cancelled(
                    instance,
                    seller.id,
                    reason='Order cancelled by customer or system'
                )
                
                print(f"[NOTIFICATION] ❌ Order Cancelled")
                print(f"Seller: {seller.restaurant_name}")
                print(f"Order: #{instance.id}")
                
            except Exception as e:
                logger.error(f"Error sending cancellation notification: {str(e)}")
