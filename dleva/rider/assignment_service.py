"""
Order Assignment Service - Phase 3
Handles matching orders to riders
"""

from django.utils import timezone
from django.db.models import Q, Count
from django.db import transaction
from datetime import timedelta
from decimal import Decimal
import math

from rider.models import RiderProfile, RiderOrder
from rider.realtime_service import RealtimeService
from buyer.models import Order
from seller.models import Restaurant

MAX_ASSIGNMENT_DISTANCE_KM = Decimal('999.99')
MAX_ASSIGNMENT_AMOUNT = Decimal('9999.99')
TIMEOUT_ONLY_RETRY_LIMIT = 2


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(float(lat1))
    lon1_rad = math.radians(float(lon1))
    lat2_rad = math.radians(float(lat2))
    lon2_rad = math.radians(float(lon2))
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    distance = R * c
    return round(distance, 2)


def calculate_delivery_fee(distance_km):
    """
    Calculate delivery fee based on distance
    
    Rules:
    - Distance ≤ 3 km → ₦300
    - 3 to 6 km → ₦400 + ₦100 per km
    - Above 6 km → ₦1000 + ₦150 per km
    """
    distance = float(distance_km)
    
    if distance <= 3:
        base_fee = Decimal('500.00')
    elif distance <= 6:
        base_fee = Decimal('600.00')
        extra_km = distance - 3
        extra_fee = Decimal(str(extra_km * 100))
        return base_fee + extra_fee
    else:
        base_fee = Decimal('1000.00')
        extra_km = distance - 6
        extra_fee = Decimal(str(extra_km * 150))
        return base_fee + extra_fee
    
    return base_fee


def calculate_rider_earning(delivery_fee):
    """
    Calculate rider earning from delivery fee
    
    Simple split:
    - Rider gets 60% of delivery fee
    - Platform keeps 40% commission
    
    Minimum earning: ₦250
    """
    rider_earning = delivery_fee * Decimal('0.60')
    minimum_earning = Decimal('250.00')
    
    if rider_earning < minimum_earning:
        rider_earning = minimum_earning
    
    return round(rider_earning, 2)


def validate_assignment_metrics(distance_km, delivery_fee, rider_earning, platform_commission):
    """
    Ensure calculated delivery metrics fit the current Order field sizes.
    """
    distance_value = Decimal(str(distance_km))
    delivery_fee_value = Decimal(str(delivery_fee))
    rider_earning_value = Decimal(str(rider_earning))
    platform_commission_value = Decimal(str(platform_commission))

    if distance_value > MAX_ASSIGNMENT_DISTANCE_KM:
        return {
            'valid': False,
            'reason': (
                f'Delivery distance ({distance_value:.2f}km) is too large for this order. '
                'Please verify the restaurant and customer coordinates.'
            )
        }

    if delivery_fee_value > MAX_ASSIGNMENT_AMOUNT:
        return {
            'valid': False,
            'reason': (
                f'Calculated delivery fee (N{delivery_fee_value:.2f}) exceeds the supported limit. '
                'Please verify the restaurant and customer coordinates.'
            )
        }

    if rider_earning_value > MAX_ASSIGNMENT_AMOUNT:
        return {
            'valid': False,
            'reason': (
                f'Calculated rider earning (N{rider_earning_value:.2f}) exceeds the supported limit. '
                'Please verify the restaurant and customer coordinates.'
            )
        }

    if platform_commission_value > MAX_ASSIGNMENT_AMOUNT:
        return {
            'valid': False,
            'reason': (
                f'Calculated platform commission (N{platform_commission_value:.2f}) exceeds the supported limit. '
                'Please verify the restaurant and customer coordinates.'
            )
        }

    return {'valid': True}


def collapse_duplicate_pending_assignments(order, rider=None):
    """
    Keep only the newest pending assignment per order/rider and reject older duplicates.
    """
    pending_assignments = RiderOrder.objects.filter(
        order=order,
        status='assigned_pending'
    )
    if rider is not None:
        pending_assignments = pending_assignments.filter(rider=rider)

    pending_assignments = pending_assignments.order_by('-assigned_at', '-id')
    assignment_groups = {}

    for assignment in pending_assignments:
        key = assignment.rider_id
        assignment_groups.setdefault(key, []).append(assignment)

    now = timezone.now()
    for assignments in assignment_groups.values():
        if len(assignments) <= 1:
            continue

        stale_ids = [assignment.id for assignment in assignments[1:]]
        RiderOrder.objects.filter(id__in=stale_ids).update(
            status='rejected',
            responded_at=now
        )


def create_or_refresh_pending_assignment(order, rider, distance_at_assignment, assignment_score):
    """
    Reuse an existing pending assignment for the same order/rider when present.
    """
    collapse_duplicate_pending_assignments(order, rider=rider)

    existing_assignment = RiderOrder.objects.filter(
        order=order,
        rider=rider,
        status='assigned_pending'
    ).order_by('-assigned_at', '-id').first()

    if existing_assignment:
        existing_assignment.distance_at_assignment = distance_at_assignment
        existing_assignment.assignment_score = assignment_score
        existing_assignment.responded_at = None
        existing_assignment.save(update_fields=[
            'distance_at_assignment',
            'assignment_score',
            'responded_at'
        ])
        return existing_assignment

    return RiderOrder.objects.create(
        order=order,
        rider=rider,
        status='assigned_pending',
        distance_at_assignment=distance_at_assignment,
        assignment_score=assignment_score
    )


def find_latest_assignment_rider_ids(order, statuses):
    """
    Return rider IDs whose most recent assignment record for this order matches
    one of the provided statuses.

    This prevents stale historical assignments from poisoning current timeout
    and rejection decisions when an order has been tested or recycled.
    """
    latest_assignments = {}

    for assignment in RiderOrder.objects.filter(order=order).order_by('-assigned_at', '-id'):
        if assignment.rider_id in latest_assignments:
            continue
        latest_assignments[assignment.rider_id] = assignment.status

    return {
        rider_id
        for rider_id, status in latest_assignments.items()
        if status in statuses
    }


def finalize_no_rider_found(order, reason):
    order.status = 'rider_not_found'
    order.assignment_status = 'rejected'
    order.assignment_timeout_at = None
    order.currently_assigned_rider_id = None
    order.driver_assigned_count = 0
    order.save(update_fields=[
        'status',
        'assignment_status',
        'assignment_timeout_at',
        'currently_assigned_rider_id',
        'driver_assigned_count',
    ])
    return {'success': False, 'reason': reason}


def find_eligible_riders(order, max_distance=15, exclude_rider_ids=None, restrict_to_rider_ids=None):
    """
    Find eligible riders for an order
    
    Filter criteria:
    - is_online = True
    - is_verified = True
    - account_status = 'approved'
    - verification_status = 'approved'
    - phone_verified = True
    - Not suspended
    - Within distance limit
    - Not already busy with too many orders
    """
    restaurant = order.restaurant
    
    # Get restaurant coordinates
    if not (restaurant.latitude and restaurant.longitude):
        print(f"[ASSIGNMENT] ❌ Restaurant {restaurant.id} has no coordinates")
        return []
    
    print(f"[ASSIGNMENT] 🔍 Finding eligible riders for Order {order.id}")
    print(f"[ASSIGNMENT] Restaurant location: ({restaurant.latitude}, {restaurant.longitude})")
    
    # ✅ Optimization: Use annotate to get active order count in one query
    available_riders = RiderProfile.objects.filter(
        is_online=True,
        is_verified=True,
        account_status='approved',
        verification_status='approved',
        phone_verified=True
    ).exclude(
        account_status='suspended'
    ).annotate(
        active_order_count=Count(
            'deliveries',
            filter=Q(deliveries__status__in=[
                'available_for_pickup',
                'awaiting_rider',
                'assigned',
                'arrived_at_pickup',
                'picked_up',
                'on_the_way',
            ])
        )
    )

    if exclude_rider_ids:
        available_riders = available_riders.exclude(id__in=exclude_rider_ids)

    if restrict_to_rider_ids is not None:
        available_riders = available_riders.filter(id__in=restrict_to_rider_ids)
    
    print(f"[ASSIGNMENT] Found {available_riders.count()} available riders (online, verified, approved)")
    
    # Calculate distance and filter
    eligible_riders = []
    
    for rider in available_riders:
        if not (rider.current_latitude and rider.current_longitude):
            continue
        
        distance = calculate_distance(
            restaurant.latitude,
            restaurant.longitude,
            rider.current_latitude,
            rider.current_longitude
        )
        
        # Only include riders within max distance and limit to 3 active orders
        if distance <= max_distance and rider.active_order_count < 3:
            eligible_riders.append({
                'rider': rider,
                'distance': distance,
                'active_orders': rider.active_order_count
            })
            print(f"[ASSIGNMENT] 📍 Rider {rider.full_name}: {distance}km away | {rider.active_order_count} active orders ✅ ELIGIBLE")
        else:
            # Optionally print why not eligible
            pass
    
    # Sort by distance (nearest first), then by last assignment time for fairness
    eligible_riders.sort(key=lambda x: (x['distance'], x['rider'].user.username))
    
    print(f"[ASSIGNMENT] Result: {len(eligible_riders)} eligible riders found\n")
    return eligible_riders


def assign_order_to_riders(
    order,
    exclude_rider_ids=None,
    restrict_to_rider_ids=None,
    finalize_on_empty=True,
    timeout_retry=False,
):
    """
    Main assignment logic:
    1. Calculate delivery fee and distance
    2. Find top 3 eligible riders
    3. Create assignment records
    4. Send push notifications to assigned riders
    5. Return list of assigned riders
    """
    
    print(f"\n{'='*80}")
    print(f"[ASSIGNMENT] Starting assignment process for Order {order.id}")
    print(f"[ASSIGNMENT] Order status: {order.status}")
    print(f"[ASSIGNMENT] Delivery address: {order.delivery_address}")
    print(f"{'='*80}\n")
    
    # Check if order has delivery coordinates
    if not (order.delivery_latitude and order.delivery_longitude):
        print(f"[ASSIGNMENT] ❌ Order {order.id} missing delivery coordinates")
        return {'success': False, 'reason': 'Missing delivery coordinates'}
    
    # Check if order is ready for assignment
    if order.status not in ['available_for_pickup', 'awaiting_rider']:
        print(f"[ASSIGNMENT] ❌ Order {order.id} is not ready for assignment (status: {order.status})")
        return {'success': False, 'reason': 'Order not ready for rider assignment'}
    
    # ✅ VALIDATE RESTAURANT HAS VALID COORDINATES
    restaurant = order.restaurant
    if not (restaurant.latitude and restaurant.longitude):
        print(f"[ASSIGNMENT] ❌ Restaurant {restaurant.id} missing coordinates")
        return finalize_no_rider_found(order, 'Restaurant location not set')
    
    # Calculate distance from restaurant to delivery location
    distance_km = calculate_distance(
        restaurant.latitude,
        restaurant.longitude,
        order.delivery_latitude,
        order.delivery_longitude
    )
    
    # Calculate delivery fee
    delivery_fee = calculate_delivery_fee(distance_km)
    rider_earning = calculate_rider_earning(delivery_fee)
    platform_commission = delivery_fee - rider_earning

    metrics_validation = validate_assignment_metrics(
        distance_km,
        delivery_fee,
        rider_earning,
        platform_commission
    )
    if not metrics_validation['valid']:
        print(f"[ASSIGNMENT] ERROR: {metrics_validation['reason']}")
        return {'success': False, 'reason': metrics_validation['reason']}

    # Save to order
    order.distance_km = Decimal(str(distance_km))
    order.delivery_fee = delivery_fee
    order.rider_earning = rider_earning
    order.platform_commission = platform_commission
    order.assignment_status = 'pending_assignment'
    order.save()
    
    print(f"[ASSIGNMENT] 📦 Order details:")
    print(f"[ASSIGNMENT] Distance: {distance_km} km")
    print(f"[ASSIGNMENT] Delivery Fee: ₦{delivery_fee}")
    print(f"[ASSIGNMENT] Rider Earning: ₦{rider_earning}\n")
    
    # Find eligible riders
    eligible_riders = find_eligible_riders(
        order,
        max_distance=15,
        exclude_rider_ids=exclude_rider_ids,
        restrict_to_rider_ids=restrict_to_rider_ids,
    )
    
    if not eligible_riders:
        if not finalize_on_empty:
            return {'success': False, 'reason': 'No eligible riders'}
        failure_reason = 'No eligible riders'
        print(f"[ASSIGNMENT] ❌ No eligible riders found for order {order.id}\n")
        return finalize_no_rider_found(order, failure_reason)
    
    # Take top 3 riders
    top_riders = eligible_riders[:3]
    
    # Start assignment process
    print(f"[ASSIGNMENT] 📤 Creating {len(top_riders)} assignment(s)...")
    
    # Create assignment records
    assigned_riders = []
    # ✅ EXTENDED: Increased from 30 to 90 seconds for better UX
    assignment_timeout = timezone.now() + timedelta(seconds=90)
    
    # Broadcast to all riders about a new available order (general pool)
    # This enables real-time refresh on rider dashboards
    RealtimeService.broadcast_new_available_order(order)
    
    # Import notification service
    from rider.notification_service import PushNotificationService
    
    for rider_data in top_riders:
        rider = rider_data['rider']
        
        # Reuse any existing pending assignment so retries do not create duplicates.
        create_or_refresh_pending_assignment(
            order=order,
            rider=rider,
            distance_at_assignment=rider_data['distance'],
            assignment_score=Decimal(str(100 - (rider_data['distance'] * 2)))
        )

        assigned_riders.append({
            'rider_id': rider.id,
            'rider_name': rider.full_name,
            'distance': rider_data['distance'],
            'status': 'pending_acceptance'
        })
        
        # 🔥 SEND PUSH NOTIFICATION TO RIDER
        # This notifies the rider immediately when order is assigned
        PushNotificationService.send_order_assigned(order, rider.id)
        
        print(f"[ASSIGNMENT] ✅ Assigned to {rider.full_name} ({rider_data['distance']}km) - Earning ₦{rider_earning}")
        print(f"[ASSIGNMENT] 📱 Notification sent to {rider.full_name}")
    
    # Update order assignment count and set to awaiting_rider
    order.driver_assigned_count = len(top_riders)
    order.assignment_timeout_at = assignment_timeout
    order.currently_assigned_rider_id = assigned_riders[0]['rider_id']
    order.status = 'awaiting_rider'  # Waiting for rider to accept
    order.assignment_status = 'reassigned' if timeout_retry else 'pending_assignment'
    order.save()
    
    print(f"[ASSIGNMENT] ✅ Assignment complete! Waiting for rider acceptance (90 second timeout)")
    print(f"{'='*80}\n")
    
    return {
        'success': True,
        'order_id': order.id,
        'distance_km': float(distance_km),
        'delivery_fee': float(delivery_fee),
        'rider_earning': float(rider_earning),
        'platform_commission': float(platform_commission),
        'assigned_riders': assigned_riders,
        'timeout_seconds': 90
    }


@transaction.atomic
def process_assignment_timeout(order):
    """
    Resolve an expired awaiting_rider order.

    Strategy:
    1. Mark current pending assignments as timeout.
    2. Try fresh riders first, excluding rejected and timed-out riders.
    3. If none found, retry only the timed-out riders up to TIMEOUT_ONLY_RETRY_LIMIT.
    4. If still none, mark order as rider_not_found.
    """
    order = Order.objects.select_for_update().get(id=order.id)

    if order.status != 'awaiting_rider':
        return {'success': False, 'reason': f'Order is not awaiting rider (status: {order.status})'}

    if order.assignment_timeout_at and order.assignment_timeout_at > timezone.now():
        return {'success': False, 'reason': 'Assignment timeout has not elapsed yet'}

    now = timezone.now()
    RiderOrder.objects.filter(
        order=order,
        status='assigned_pending'
    ).update(
        status='timeout',
        responded_at=now
    )

    rejected_rider_ids = find_latest_assignment_rider_ids(order, ['rejected'])
    timed_out_rider_ids = find_latest_assignment_rider_ids(order, ['timeout'])

    fresh_search_result = assign_order_to_riders(
        order,
        exclude_rider_ids=rejected_rider_ids | timed_out_rider_ids,
        finalize_on_empty=False,
    )
    if fresh_search_result.get('success'):
        if order.assignment_timeout_retry_count != 0:
            order.assignment_timeout_retry_count = 0
            order.save(update_fields=['assignment_timeout_retry_count'])
        fresh_search_result['retry_mode'] = 'fresh_rider'
        return fresh_search_result

    if timed_out_rider_ids and order.assignment_timeout_retry_count < TIMEOUT_ONLY_RETRY_LIMIT:
        order.assignment_timeout_retry_count += 1
        order.save(update_fields=['assignment_timeout_retry_count'])

        timeout_retry_result = assign_order_to_riders(
            order,
            exclude_rider_ids=rejected_rider_ids,
            restrict_to_rider_ids=timed_out_rider_ids,
            finalize_on_empty=False,
            timeout_retry=True,
        )
        if timeout_retry_result.get('success'):
            timeout_retry_result['retry_mode'] = 'timed_out_rider_retry'
            timeout_retry_result['timeout_retry_count'] = order.assignment_timeout_retry_count
            return timeout_retry_result

    return finalize_no_rider_found(order, 'No riders available after timeout')


@transaction.atomic
def handle_rider_acceptance(order_id, rider_id):
    """
    When a rider accepts an order:
    1. Lock the order to that rider
    2. Reject other pending assignments
    3. Update BOTH Order and RiderOrder status atomically
    4. Track response timestamp
    """
    try:
        order = Order.objects.select_for_update().get(id=order_id)
        rider = RiderProfile.objects.get(id=rider_id)
    except (Order.DoesNotExist, RiderProfile.DoesNotExist):
        return {'success': False, 'reason': 'Order or Rider not found'}

    collapse_duplicate_pending_assignments(order, rider=rider)
    
    # Check if rider is still verified and available
    if not (rider.is_verified and rider.is_online and not rider.account_status == 'suspended'):
        return {'success': False, 'reason': 'Rider no longer available'}

    if order.status not in ['available_for_pickup', 'awaiting_rider', 'assigned']:
        return {'success': False, 'reason': f'Order is not available for acceptance (status: {order.status})'}

    pending_assignment = RiderOrder.objects.select_for_update().filter(
        order=order,
        rider=rider,
        status='assigned_pending'
    ).order_by('-assigned_at', '-id').first()

    if not pending_assignment:
        if order.rider_id == rider.id and order.status == 'assigned':
            return {
                'success': True,
                'message': 'Order already accepted',
                'order_id': order.id,
                'rider': rider.full_name,
                'earning': float(order.rider_earning)
            }
        return {'success': False, 'reason': 'No pending assignment for this rider'}

    if order.rider_id and order.rider_id != rider.id and order.status == 'assigned':
        return {'success': False, 'reason': 'Order has already been accepted by another rider'}
    
    # Lock order to this rider
    now = timezone.now()
    order.rider = rider
    order.status = 'assigned'
    order.assignment_status = 'assigned'
    order.assignment_timeout_at = None
    order.assignment_timeout_retry_count = 0
    order.arrived_at_pickup = None
    order.picked_up_at = None
    order.delivery_attempted_at = None
    order.delivered_at = None
    order.delivery_proof_photo = None
    order.assigned_at = order.assigned_at or now
    order.final_assigned_at = now
    order.currently_assigned_rider_id = rider.id
    order.save(update_fields=[
        'rider',
        'status',
        'assignment_status',
        'assignment_timeout_at',
        'assignment_timeout_retry_count',
        'arrived_at_pickup',
        'picked_up_at',
        'delivery_attempted_at',
        'delivered_at',
        'delivery_proof_photo',
        'assigned_at',
        'final_assigned_at',
        'currently_assigned_rider_id',
    ])

    # Mark all other pending rider assignments as rejected with timestamp.
    RiderOrder.objects.filter(
        order=order,
        status='assigned_pending'
    ).exclude(id=pending_assignment.id).update(
        status='rejected',
        responded_at=now
    )
    
    pending_assignment.status = 'accepted'
    pending_assignment.responded_at = now
    pending_assignment.save(update_fields=['status', 'responded_at'])
    
    print(f"\n{'='*60}")
    print(f"✅ ORDER #{order.id} ACCEPTED BY RIDER")
    print(f"Rider: {rider.full_name}")
    print(f"Earning: ₦{order.rider_earning}")
    print(f"Status: LOCKED & READY FOR PICKUP")
    print(f"{'='*60}\n")
    
    # Broadcast status update
    RealtimeService.broadcast_order_status(
        order.id, 
        'assigned', 
        f'Order has been accepted by rider {rider.full_name}'
    )
    
    return {
        'success': True,
        'message': 'Order accepted successfully',
        'order_id': order.id,
        'rider': rider.full_name,
        'earning': float(order.rider_earning)
    }


@transaction.atomic
def handle_rider_rejection(order_id, rider_id):
    """
    When a rider rejects an order:
    1. Mark assignment as rejected with timestamp
    2. Try next rider
    """
    try:
        order = Order.objects.select_for_update().get(id=order_id)
        rider = RiderProfile.objects.get(id=rider_id)
    except (Order.DoesNotExist, RiderProfile.DoesNotExist):
        return {'success': False, 'reason': 'Order or Rider not found'}

    collapse_duplicate_pending_assignments(order, rider=rider)

    rejected_count = RiderOrder.objects.filter(
        order=order,
        rider=rider,
        status='assigned_pending'
    ).update(
        status='rejected',
        responded_at=timezone.now()
    )

    if rejected_count == 0:
        return {'success': False, 'reason': 'No pending assignment for this rider'}
    
    print(f"[Assignment] Rider {rider.full_name} rejected order {order.id}")
    
    # Check if there are still pending assignments
    pending = RiderOrder.objects.filter(
        order=order,
        status='assigned_pending'
    ).first()
    
    if pending:
        # Move to next rider
        return {
            'success': True,
            'message': 'Trying next rider',
            'next_rider': pending.rider.full_name
        }
    else:
        # No more riders available
        order.status = 'rider_not_found'
        order.assignment_status = 'rejected'
        order.save()
        
        print(f"[Assignment] No more riders available for order {order.id}")
        return {
            'success': False,
            'reason': 'No more riders available'
        }
