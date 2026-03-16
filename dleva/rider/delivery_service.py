"""
Delivery Lifecycle Service
Handles status transitions and validations for the delivery state machine.
Enforces strict state transitions to prevent system exploitation.
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from buyer.models import Order
from rider.models import RiderProfile, RiderWallet, RiderTransaction, RiderOrder


from rider.realtime_service import RealtimeService


class DeliveryStateError(Exception):
    """Raised when invalid state transition is attempted"""
    pass


class DeliveryService:
    """
    Manages delivery state machine with strict validation.
    
    State Flow:
    assigned → arrived_at_pickup → released_by_seller → picked_up 
    → on_the_way → (delivery_attempted*)* → delivered / cancelled
    
    * delivery_attempted can repeat up to 3 times with increasing delays
    """
    
    # Valid state transitions - aligned with frontend workflow
    VALID_TRANSITIONS = {
        'assigned': ['arrived_at_pickup', 'cancelled'],
        'arrived_at_pickup': ['picked_up', 'cancelled'],
        'picked_up': ['delivery_attempted', 'delivered', 'on_the_way', 'cancelled'],
        'on_the_way': ['delivery_attempted', 'delivered', 'cancelled'],
        'delivery_attempted': ['delivered', 'cancelled'],
        'delivered': [],  # Final state
        'cancelled': [],  # Final state
    }
    
    # Status requirements - states that must be reached before delivery
    MANDATORY_STATES = [
        'arrived_at_pickup',
        'picked_up',
    ]
    
    @staticmethod
    def _validate_transition(current_status: str, new_status: str) -> None:
        """Validate that status transition is allowed"""
        if current_status not in DeliveryService.VALID_TRANSITIONS:
            raise DeliveryStateError(f"Unknown status: {current_status}")
        
        if new_status not in DeliveryService.VALID_TRANSITIONS[current_status]:
            raise DeliveryStateError(
                f"Invalid transition: {current_status} → {new_status}"
            )
    
    @staticmethod
    def _get_rider_profile(order: Order) -> RiderProfile:
        """Get rider profile or raise error"""
        if not order.rider:
            raise DeliveryStateError("Order has no assigned rider")
        
        try:
            return RiderProfile.objects.get(id=order.rider.id)
        except RiderProfile.DoesNotExist:
            raise DeliveryStateError("Rider profile not found")
    
    @staticmethod
    @transaction.atomic
    def arrived_at_pickup(order_id: int, rider_id: int) -> dict:
        """
        Rider confirms arrival at restaurant pickup location.
        Updates BOTH Order and RiderOrder models.
        
        Transition: Order: assigned → arrived_at_pickup
                  RiderOrder: accepted → arrived_at_location
        """
        from rider.models import RiderOrder
        
        order = Order.objects.select_for_update().get(id=order_id)
        
        DeliveryService._validate_transition(order.status, 'arrived_at_pickup')
        
        rider_profile = DeliveryService._get_rider_profile(order)
        
        if rider_profile.user.id != rider_id:
            raise DeliveryStateError("Rider not assigned to this order")
        
        if not rider_profile.is_online:
            raise DeliveryStateError("Rider must be online")
        
        # Update Order status
        order.status = 'arrived_at_pickup'
        order.arrived_at_pickup = timezone.now()
        order.save()
        
        # Update RiderOrder status (use filter().first() to handle multiple records)
        try:
            rider_order = RiderOrder.objects.filter(
                order=order, 
                rider=rider_profile, 
                status='accepted'
            ).order_by('-assigned_at').first()
            if rider_order:
                rider_order.status = 'arrived_at_location'
                rider_order.arrived_at = timezone.now()
                rider_order.save()
        except Exception:
            pass
        
        # Broadcast status update
        RealtimeService.broadcast_order_status(
            order.id, 
            'arrived_at_pickup', 
            'Rider has arrived at the restaurant'
        )
        
        return {
            'status': 'success',
            'message': 'Arrived at pickup location',
            'order_id': order.id,
            'arrived_at': order.arrived_at_pickup.isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def rider_pickup_order(order_id: int, rider_id: int) -> dict:
        """
        Rider confirms pickup of order from restaurant.
        Updates BOTH Order and RiderOrder models.
        
        Transition: Order: arrived_at_pickup → picked_up
                  RiderOrder: arrived_at_location → picked_up
        
        Requirements:
        - Order must be in 'arrived_at_pickup' status
        - Rider must match order's assigned rider
        - Rider must still be online
        """
        from rider.models import RiderOrder
        
        order = Order.objects.select_for_update().get(id=order_id)
        
        DeliveryService._validate_transition(order.status, 'picked_up')
        
        rider_profile = DeliveryService._get_rider_profile(order)
        
        if rider_profile.user.id != rider_id:
            raise DeliveryStateError("Rider not assigned to this order")
        
        if not rider_profile.is_online:
            raise DeliveryStateError("Rider must be online")
        
        # Update Order status (picked_up means "on the way")
        order.status = 'picked_up'
        order.picked_up_at = timezone.now()
        order.save()
        
        # Update RiderOrder status (use filter().first() to handle multiple records)
        try:
            rider_order = RiderOrder.objects.filter(
                order=order, 
                rider=rider_profile, 
                status='arrived_at_location'
            ).order_by('-assigned_at').first()
            if rider_order:
                rider_order.status = 'picked_up'
                rider_order.picked_up_at = timezone.now()
                rider_order.save()
        except Exception:
            pass
        
        # Broadcast status update
        RealtimeService.broadcast_order_status(
            order.id, 
            'picked_up', 
            'Rider has picked up the order and is on the way'
        )
        
        return {
            'status': 'success',
            'message': 'Food picked up - heading to customer',
            'order_id': order.id,
            'picked_up_at': order.picked_up_at.isoformat(),
            'confirmation_code': order.confirmation_code,  # Send to rider for delivery verification
            'destination': {
                'address': order.delivery_address,
                'latitude': order.delivery_latitude,
                'longitude': order.delivery_longitude,
            }
        }
    
    @staticmethod
    @transaction.atomic
    def on_the_way(order_id: int, rider_id: int) -> dict:
        """
        Rider confirms departure towards customer.
        
        Transition: picked_up → on_the_way
        Requirements:
        - Order must be in 'picked_up' status
        - Rider must match order's assigned rider
        - Order must have been picked up
        """
        order = Order.objects.select_for_update().get(id=order_id)
        
        DeliveryService._validate_transition(order.status, 'on_the_way')
        
        rider_profile = DeliveryService._get_rider_profile(order)
        
        if rider_profile.user.id != rider_id:
            raise DeliveryStateError("Rider not assigned to this order")
        
        # Update order
        order.status = 'on_the_way'
        order.save()
        
        return {
            'status': 'success',
            'message': 'Heading to customer - ETA in progress',
            'order_id': order.id,
            'status_updated_at': timezone.now().isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def delivery_attempt(order_id: int, rider_id: int, reason: str = '') -> dict:
        """
        Rider attempts delivery but customer unreachable.
        Can be repeated up to 3 times with increasing backoff delays.
        
        Transition: on_the_way/delivery_attempted → delivery_attempted
        Requirements:
        - Order must be in 'on_the_way' or 'delivery_attempted' status
        - Rider must match order's assigned rider
        - Max 3 attempts before cancellation
        """
        order = Order.objects.select_for_update().get(id=order_id)
        
        DeliveryService._validate_transition(order.status, 'delivery_attempted')
        
        rider_profile = DeliveryService._get_rider_profile(order)
        
        if rider_profile.user.id != rider_id:
            raise DeliveryStateError("Rider not assigned to this order")
        
        # Count attempt attempts (check delivery_attempted_at timestamps)
        attempts = DeliveryService._count_delivery_attempts(order)
        
        if attempts >= 3:
            raise DeliveryStateError(
                f"Max delivery attempts (3) reached. Order must be cancelled."
            )
        
        # Calculate recommended backoff delay for next attempt
        backoff_seconds = 60 * (attempts + 1)  # 1min, 2min, 3min
        next_attempt_time = timezone.now() + timedelta(seconds=backoff_seconds)
        
        # Update order
        order.status = 'delivery_attempted'
        order.delivery_attempted_at = timezone.now()
        order.save()
        
        return {
            'status': 'success',
            'message': f'Delivery attempt {attempts + 1}/3 recorded',
            'order_id': order.id,
            'attempt_number': attempts + 1,
            'reason': reason,
            'attempted_at': order.delivery_attempted_at.isoformat(),
            'recommended_backoff_seconds': backoff_seconds,
            'next_attempt_available_at': next_attempt_time.isoformat(),
        }
    
    @staticmethod
    def _count_delivery_attempts(order: Order) -> int:
        """Count how many delivery attempts have been made"""
        # Since we're reusing the same delivery_attempted_at timestamp,
        # we can check the order history if we add an attempt counter
        # For now, we'll track via RiderOrder model relationship
        try:
            rider_order = RiderOrder.objects.filter(order_id=order.id).order_by('-assigned_at').first()
            if rider_order:
                return getattr(rider_order, 'delivery_attempt_count', 0)
            return 0
        except Exception:
            return 0
    
    @staticmethod
    @transaction.atomic
    def verify_and_deliver(order_id: int, rider_id: int, 
                          delivery_pin: str, proof_photo_url: str = '') -> dict:
        """
        Final delivery: Rider verifies confirmation code and completes delivery.
        
        Transition: on_the_way/delivery_attempted → delivered
        Actions:
        - Verify confirmation code matches
        - Mark as delivered
        - Credit rider wallet with earning
        - Create transaction record
        - Reset rider assignment timeout
        
        Requirements:
        - Order must be in 'on_the_way' or 'delivery_attempted' status
        - Confirmation code must match exactly
        - Rider must match order's assigned rider
        """
        order = Order.objects.select_for_update().get(id=order_id)
        
        DeliveryService._validate_transition(order.status, 'delivered')
        
        rider_profile = DeliveryService._get_rider_profile(order)
        
        if rider_profile.user.id != rider_id:
            raise DeliveryStateError("Rider not assigned to this order")
        
        # Verify confirmation code
        if order.confirmation_code != delivery_pin:
            raise DeliveryStateError("Invalid confirmation code")
        
        # Mark as delivered
        order.status = 'delivered'
        order.delivered_at = timezone.now()
        if proof_photo_url:
            order.delivery_proof_photo = proof_photo_url
        order.save()
        
        # ==== CRITICAL: Credit rider wallet (PHASE 5) ====
        # Money goes to pending_balance first (24-hour hold for disputes)
        # After 24 hours, it will be moved to available_balance by scheduled task
        wallet = RiderWallet.objects.select_for_update().get(
            rider=rider_profile
        )
        
        # Verify wallet is not frozen
        if wallet.is_frozen:
            raise DeliveryStateError("Rider wallet is frozen - cannot credit earnings")
        
        earning_amount = order.rider_earning
        wallet.pending_balance += earning_amount
        wallet.total_earned += earning_amount
        wallet.save()
        
        # Create transaction record for audit trail
        transaction = RiderTransaction.objects.create(
            rider=rider_profile,
            order=order,
            amount=earning_amount,
            transaction_type='delivery_earning',
            status='completed',
            description=f'Delivery completed for Order #{order.id}'
        )
        
        # ===== Update rider stats =====
        rider_profile.total_deliveries += 1
        rider_profile.save()
        
        # ===== Update rider assignment with completed timestamp =====
        try:
            rider_order = RiderOrder.objects.select_for_update().filter(
                order_id=order.id
            ).order_by('-assigned_at').first()
            if rider_order:
                rider_order.status = 'completed'
                rider_order.completed_at = timezone.now()
                rider_order.save()
        except Exception:
            pass
        
        # Broadcast status update
        RealtimeService.broadcast_order_status(
            order.id, 
            'delivered', 
            'Order has been successfully delivered and verified'
        )
        
        return {
            'status': 'success',
            'message': 'Delivery completed - earning will be available after 24 hours (dispute hold)',
            'order_id': order.id,
            'delivered_at': order.delivered_at.isoformat(),
            'rider_earning': str(order.rider_earning),
            'pending_balance': str(wallet.pending_balance),  # Waiting for 24-hour hold
            'available_balance': str(wallet.available_balance),
            'total_deliveries': rider_profile.total_deliveries,
        }
    
    @staticmethod
    @transaction.atomic
    def cancel_delivery(order_id: int, user_id: int, 
                       user_type: str, reason: str = '') -> dict:
        """
        Cancel delivery order.
        
        Transition: (multiple) → cancelled
        Rules:
        - Seller can cancel if not yet picked up
        - Rider can cancel if not yet delivered (loses eligibility)
        - Admin can always cancel
        
        Requirements:
        - User must be seller, rider, or admin
        - Cannot cancel from final states (delivered)
        """
        order = Order.objects.select_for_update().get(id=order_id)
        
        # Find who's trying to cancel
        if user_type == 'rider':
            rider_profile = RiderProfile.objects.get(user__id=user_id)
            if order.rider.id != rider_profile.id:
                raise DeliveryStateError("Rider can only cancel own deliveries")
        elif user_type == 'seller':
            # Seller can only cancel before pickup
            if order.status in ['picked_up', 'on_the_way', 'delivery_attempted']:
                raise DeliveryStateError(
                    "Cannot cancel after rider has picked up order"
                )
        # Admin can cancel regardless
        
        # Validate state is cancellable
        if order.status == 'delivered':
            raise DeliveryStateError("Cannot cancel completed deliveries")
        
        if order.status == 'cancelled':
            raise DeliveryStateError("Order already cancelled")
        
        old_status = order.status
        
        # Mark as cancelled
        order.status = 'cancelled'
        order.save()
        
        # If order was assigned, rider loses this delivery
        if old_status in ['assigned', 'arrived_at_pickup', 'released_by_seller', 
                         'picked_up', 'on_the_way', 'delivery_attempted']:
            if order.rider:
                try:
                    rider_order = RiderOrder.objects.filter(
                        order_id=order.id
                    ).order_by('-assigned_at').first()
                    if rider_order:
                        rider_order.status = 'cancelled'
                        rider_order.save()
                except Exception:
                    pass
        
        return {
            'status': 'success',
            'message': 'Delivery cancelled',
            'order_id': order.id,
            'previous_status': old_status,
            'cancelled_by': user_type,
            'reason': reason,
            'cancelled_at': timezone.now().isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def update_rider_location(order_id: int, rider_id: int, 
                            latitude: float, longitude: float) -> dict:
        """
        Update rider's current delivery location (GPS update) with address.
        Called every 20-30 seconds during delivery.
        
        Requirements:
        - Order must be in delivery state (on_the_way/delivery_attempted)
        - Rider must match order's assigned rider
        """
        from core.location_service import LocationService
        
        order = Order.objects.get(id=order_id)
        
        # Only update location during active delivery
        if order.status not in ['picked_up', 'on_the_way', 'delivery_attempted']:
            raise DeliveryStateError(
                f"Cannot update location in {order.status} status"
            )
        
        rider_profile = DeliveryService._get_rider_profile(order)
        
        if rider_profile.user.id != rider_id:
            raise DeliveryStateError("Rider not assigned to this order")
        
        # Update rider's current location with reverse geocoding
        address = None
        try:
            geocode_result = LocationService.reverse_geocode(latitude, longitude)
            address = geocode_result.get('address', '')
        except Exception as e:
            # Non-critical error - location is still updated without address
            pass
        
        # Update rider profile with coordinates and address
        rider_profile.current_latitude = latitude
        rider_profile.current_longitude = longitude
        rider_profile.last_location_update = timezone.now()
        if address:
            rider_profile.address = address
        rider_profile.save()
        
        return {
            'status': 'success',
            'message': 'Location updated',
            'order_id': order.id,
            'address': address,
            'latitude': latitude,
            'longitude': longitude,
            'updated_at': timezone.now().isoformat(),
        }
    
    @staticmethod
    def get_delivery_status(order_id: int) -> dict:
        """Get detailed delivery status for order"""
        order = Order.objects.get(id=order_id)
        
        return {
            'order_id': order.id,
            'current_status': order.status,
            'rider': {
                'id': order.rider.id if order.rider else None,
                'name': order.rider.get_full_name() if order.rider else None,
            },
            'timeline': {
                'assigned_at': order.assigned_at.isoformat() if order.assigned_at else None,
                'arrived_at_pickup': order.arrived_at_pickup.isoformat() if order.arrived_at_pickup else None,
                'released_at': order.released_at.isoformat() if order.released_at else None,
                'picked_up_at': order.picked_up_at.isoformat() if order.picked_up_at else None,
                'delivery_attempted_at': order.delivery_attempted_at.isoformat() if order.delivery_attempted_at else None,
                'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None,
            },
            'restaurant': {
                'name': order.restaurant.restaurant_name if order.restaurant else None,
            },
            'customer': {
                'phone': order.phone_number,
                'address': order.delivery_address,
            },
            'earning': str(order.rider_earning) if order.rider_earning else '0.00',
        }
