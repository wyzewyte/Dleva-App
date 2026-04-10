"""
Buyer Signals - Push Notifications
Triggers notifications when order status changes relevant to buyer
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from buyer.models import Order
from buyer.notification_service import BuyerPushNotificationService
import logging

logger = logging.getLogger(__name__)


def _has_updated_field(update_fields, field_name):
    # Legacy handlers below are superseded by robust change tracking further
    # down in this module. Keep them inactive to avoid duplicate notifications.
    return False


@receiver(post_save, sender=Order)
def notify_buyer_on_order_confirmed(sender, instance, created, update_fields, **kwargs):
    """
    When seller confirms order, notify buyer (status: pending → confirming)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'confirming' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_confirmed',
                title='✅ Order Confirmed',
                message='Your order has been confirmed by the restaurant',
                order_id=instance.id,
                sound=True,
            )
            print(f"[NOTIFICATION] ✅ Order Confirmed - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending order_confirmed notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_order_processing(sender, instance, created, update_fields, **kwargs):
    """
    When seller starts preparing order, notify buyer (status: confirming → preparing)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'preparing' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_processing',
                title='👨‍🍳 Order Being Prepared',
                message='Your order is being prepared',
                order_id=instance.id,
                sound=False,
            )
            print(f"[NOTIFICATION] 👨‍🍳 Order Processing - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending order_processing notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_order_ready(sender, instance, created, update_fields, **kwargs):
    """
    When order is ready for pickup, notify buyer (status: preparing → available_for_pickup)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'available_for_pickup' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_ready',
                title='🎉 Order Ready!',
                message='Your order is ready! Finding you a rider now...',
                order_id=instance.id,
                sound=True,
            )
            print(f"[NOTIFICATION] 🎉 Order Ready - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending order_ready notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_rider_assigned(sender, instance, created, update_fields, **kwargs):
    """
    When rider is assigned to order, notify buyer (status: awaiting_rider → assigned)
    """
    status_changed_to_assigned = _has_updated_field(update_fields, 'status') and instance.status == 'assigned'
    rider_changed = _has_updated_field(update_fields, 'rider') and instance.rider
    if (status_changed_to_assigned or rider_changed) and instance.buyer:
        try:
            rider_name = instance.rider.full_name if instance.rider else 'Your Rider'
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='rider_assigned',
                title=f'🚴 Rider Assigned: {rider_name}',
                message=f'Rider {rider_name} has been assigned to deliver your order',
                order_id=instance.id,
                sound=True,
            )
            print(f"[NOTIFICATION] 🚴 Rider Assigned - Buyer #{instance.buyer.id}, Rider: {rider_name}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending rider assigned notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_order_picked_up(sender, instance, created, update_fields, **kwargs):
    """
    When rider picks up order, notify buyer (status: arrived_at_pickup → picked_up)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'picked_up' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_picked_up',
                title='📦 Order Picked Up',
                message='Your order has been picked up. On the way!',
                order_id=instance.id,
                sound=False,
            )
            print(f"[NOTIFICATION] 📦 Order Picked Up - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending order_picked_up notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_order_on_the_way(sender, instance, created, update_fields, **kwargs):
    """
    When rider is on the way to buyer, notify buyer (status: picked_up → on_the_way)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'on_the_way' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_on_the_way',
                title='🚗 On the Way',
                message='Your order is on the way! Be ready to receive it.',
                order_id=instance.id,
                sound=True,
            )
            print(f"[NOTIFICATION] 🚗 On the Way - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending on_the_way notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_order_delivered(sender, instance, created, update_fields, **kwargs):
    """
    When order is delivered, notify buyer (status: on_the_way → delivered)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'delivered' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_delivered',
                title='✅ Order Delivered',
                message='Your order has been delivered. Enjoy!',
                order_id=instance.id,
                sound=True,
            )
            print(f"[NOTIFICATION] ✅ Order Delivered - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending order_delivered notification: {str(e)}")


@receiver(post_save, sender=Order)
def notify_buyer_on_order_cancelled(sender, instance, created, update_fields, **kwargs):
    """
    When order is cancelled, notify buyer (status: * → cancelled)
    """
    if _has_updated_field(update_fields, 'status') and instance.status == 'cancelled' and instance.buyer:
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='order_delivered',  # Use delivered type as fallback (could add 'cancelled' type later)
                title='❌ Order Cancelled',
                message='Your order has been cancelled. Check your account for details.',
                order_id=instance.id,
                sound=True,
            )
            print(f"[NOTIFICATION] ❌ Order Cancelled - Buyer #{instance.buyer.id}, Order #{instance.id}")
        except Exception as e:
            logger.error(f"Error sending order_cancelled notification: {str(e)}")


STATUS_NOTIFICATION_MAP = {
    'confirming': {
        'notification_type': 'order_confirmed',
        'title': 'Order Confirmed',
        'message': 'Your order has been confirmed by the restaurant.',
        'sound': True,
    },
    'preparing': {
        'notification_type': 'order_processing',
        'title': 'Order Being Prepared',
        'message': 'Your order is now being prepared.',
        'sound': False,
    },
    'available_for_pickup': {
        'notification_type': 'order_ready',
        'title': 'Order Ready',
        'message': 'Your order is ready and we are finding you a rider now.',
        'sound': True,
    },
    'awaiting_rider': {
        'notification_type': 'order_ready',
        'title': 'Finding a Rider',
        'message': 'Your order is ready. We are waiting for a rider to accept it.',
        'sound': False,
    },
    'arrived_at_pickup': {
        'notification_type': 'rider_arrived_at_restaurant',
        'title': 'Rider Arrived at Restaurant',
        'message': 'Your rider has arrived at the restaurant for pickup.',
        'sound': False,
    },
    'picked_up': {
        'notification_type': 'order_picked_up',
        'title': 'Order Picked Up',
        'message': 'Your order has been picked up and is heading your way.',
        'sound': True,
    },
    'on_the_way': {
        'notification_type': 'order_on_the_way',
        'title': 'On the Way',
        'message': 'Your order is on the way. Please be ready to receive it.',
        'sound': True,
    },
    'delivery_attempted': {
        'notification_type': 'delivery_attempted',
        'title': 'Delivery Attempted',
        'message': 'The rider tried to reach you. Please check your phone and order details.',
        'sound': True,
    },
    'delivered': {
        'notification_type': 'order_delivered',
        'title': 'Order Delivered',
        'message': 'Your order has been delivered. Enjoy your meal.',
        'sound': True,
    },
    'cancelled': {
        'notification_type': 'order_delivered',
        'title': 'Order Cancelled',
        'message': 'Your order has been cancelled. Please check your account for details.',
        'sound': True,
    },
}


@receiver(pre_save, sender=Order)
def track_previous_order_state(sender, instance, **kwargs):
    """
    Capture old status and rider before save so post_save can detect real
    transitions even when callers use plain save() without update_fields.
    """
    instance._previous_status = None
    instance._previous_rider_id = None

    if not instance.pk:
        return

    previous = Order.objects.filter(pk=instance.pk).values('status', 'rider_id').first()
    if previous:
        instance._previous_status = previous['status']
        instance._previous_rider_id = previous['rider_id']


def _send_reliable_buyer_status_notification(instance):
    config = STATUS_NOTIFICATION_MAP.get(instance.status)
    if not config or not instance.buyer:
        return

    BuyerPushNotificationService.send_notification(
        buyer_id=instance.buyer.id,
        notification_type=config['notification_type'],
        title=config['title'],
        message=config['message'],
        order_id=instance.id,
        sound=config['sound'],
    )


@receiver(post_save, sender=Order)
def notify_buyer_on_order_updates_reliably(sender, instance, created, **kwargs):
    """
    Reliable buyer notifications for actual status/rider changes.
    """
    if created or not instance.buyer:
        return

    previous_status = getattr(instance, '_previous_status', None)
    previous_rider_id = getattr(instance, '_previous_rider_id', None)
    status_changed = previous_status != instance.status
    rider_changed = previous_rider_id != instance.rider_id

    if instance.status == 'assigned' and (status_changed or rider_changed) and instance.rider:
        rider_name = instance.rider.full_name or 'Your rider'
        try:
            BuyerPushNotificationService.send_notification(
                buyer_id=instance.buyer.id,
                notification_type='rider_assigned',
                title=f'Rider Assigned: {rider_name}',
                message=f'Rider {rider_name} has been assigned to deliver your order.',
                order_id=instance.id,
                sound=True,
            )
        except Exception as exc:
            logger.error("Error sending buyer assigned notification for order %s: %s", instance.id, exc)
        return

    if not status_changed:
        return

    try:
        _send_reliable_buyer_status_notification(instance)
    except Exception as exc:
        logger.error(
            "Error sending buyer status notification for order %s (%s -> %s): %s",
            instance.id,
            previous_status,
            instance.status,
            exc,
        )
