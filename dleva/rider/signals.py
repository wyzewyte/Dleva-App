from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import RiderProfile, RiderWallet, RiderTransaction, RiderRating
from buyer.models import Order
from decimal import Decimal


# Auto-create RiderWallet when RiderProfile is created
@receiver(post_save, sender=RiderProfile)
def create_rider_wallet(sender, instance, created, **kwargs):
    """Create wallet automatically when a new rider profile is created"""
    if created:
        RiderWallet.objects.create(rider=instance)


@receiver(post_save, sender=RiderProfile)
def save_rider_wallet(sender, instance, **kwargs):
    """Save wallet when rider profile is saved"""
    if hasattr(instance, 'wallet'):
        instance.wallet.save()


# Handle delivery completion logic
@receiver(post_save, sender=Order)
def handle_order_delivery(sender, instance, created, update_fields, **kwargs):
    """
    When Order status becomes Delivered:
    - Use rider_earning already calculated by assignment_service
    - Create RiderTransaction
    - Update RiderWallet.available_balance
    - Increase total_deliveries
    - Update average_rating later
    
    NOTE: Delivery fee split is calculated in assignment_service.py:
    - Rider gets 60% of delivery_fee (stored in order.rider_earning)
    - Platform keeps 40% commission (stored in order.platform_commission)
    """
    
    # Only process if status changed to delivered
    if instance.status == 'delivered' and instance.rider:
        # Check if transaction already exists for this order (to avoid duplicates)
        transaction_exists = RiderTransaction.objects.filter(
            order=instance,
            transaction_type='delivery_earning'
        ).exists()
        
        if not transaction_exists and instance.rider_earning:
            rider_profile = instance.rider
            rider_earning = instance.rider_earning
            
            # Create RiderTransaction with pre-calculated rider earning
            transaction = RiderTransaction.objects.create(
                rider=rider_profile,
                order=instance,
                amount=rider_earning,
                transaction_type='delivery_earning',
                status='completed'
            )
            
            # Update RiderWallet with pre-calculated earning
            wallet = rider_profile.wallet
            wallet.available_balance += rider_earning
            wallet.total_earned += rider_earning
            wallet.save()
            
            # Increment total_deliveries
            rider_profile.total_deliveries += 1
            rider_profile.save()
            
            # Update delivered_at timestamp if not already set
            if not instance.delivered_at:
                instance.delivered_at = timezone.now()
                instance.save(update_fields=['delivered_at'])


# Update rider average rating when a new rating is created
@receiver(post_save, sender=RiderRating)
def update_rider_average_rating(sender, instance, created, **kwargs):
    """Update rider's average rating when a new rating is added"""
    if created:
        rider = instance.rider
        ratings = rider.ratings.all()
        
        if ratings.exists():
            avg_rating = sum(r.rating for r in ratings) / ratings.count()
            rider.average_rating = Decimal(str(round(avg_rating, 2)))
            rider.save(update_fields=['average_rating'])


# Delete related transaction when order is cancelled
@receiver(post_save, sender=Order)
def handle_order_cancellation(sender, instance, **kwargs):
    """Remove delivery transaction if order is cancelled after being completed"""
    if instance.status == 'cancelled':
        # Delete any delivery earning transactions for this order
        RiderTransaction.objects.filter(
            order=instance,
            transaction_type='delivery_earning',
            status='completed'
        ).delete()


# ============================================================
# CRITICAL: Sync RiderOrder status changes to Order model
# ============================================================
# When a rider updates their status, this signal automatically
# syncs the corresponding Order status to keep models in sync
from .models import RiderOrder

@receiver(post_save, sender=RiderOrder)
def sync_riderorder_to_order(sender, instance, created, update_fields, **kwargs):
    """
    When RiderOrder status changes, automatically update the Order with corresponding status.
    Also ensures Order.rider FK is set when rider is engaged.
    
    Mapping:
    - accepted → Order.status = 'assigned' + Order.rider = assigned rider
    - arrived_at_location → Order.status = 'arrived_at_pickup'
    - picked_up → Order.status = 'picked_up'
    - completed → Order.status = 'delivered'
    - rejected/timeout → (handled by assignment logic)
    """
    # Skip if this is a creation and status is just the default
    if created and instance.status == 'assigned_pending':
        return
    
    # Get the order
    order = instance.order
    
    # Status mapping from RiderOrder to Order
    STATUS_MAP = {
        'accepted': 'assigned',
        'arrived_at_location': 'arrived_at_pickup',
        'picked_up': 'picked_up',
        'completed': 'delivered',
    }
    
    # Check if this RiderOrder status should be synced to Order
    new_order_status = STATUS_MAP.get(instance.status)
    
    # Track if we need to save
    needs_save = False
    
    # Sync status if it should change
    if new_order_status and order.status != new_order_status:
        print(f"\n{'='*70}")
        print(f"[SIGNAL] Syncing RiderOrder to Order")
        print(f"Order #{order.id}: '{order.status}' -> '{new_order_status}'")
        print(f"RiderOrder: {instance.rider.full_name} - '{instance.status}'")
        print(f"{'='*70}\n")
        
        # Update Order status
        order.status = new_order_status
        needs_save = True
        
        # Also update corresponding timestamp fields
        if instance.status == 'arrived_at_location' and instance.arrived_at:
            order.arrived_at_pickup = instance.arrived_at
        elif instance.status == 'picked_up' and instance.picked_up_at:
            order.picked_up_at = instance.picked_up_at
        elif instance.status == 'completed' and instance.completed_at:
            order.delivered_at = instance.completed_at
    
    # Sync rider FK when RiderOrder is accepted or beyond
    # This ensures Order.rider is always set when rider is engaged
    if instance.status in ['accepted', 'arrived_at_location', 'picked_up', 'completed']:
        if order.rider != instance.rider:
            print(f"[SIGNAL] Setting Order #{order.id}.rider = {instance.rider.full_name}")
            order.rider = instance.rider
            needs_save = True
    
    if needs_save:
        order.save()
