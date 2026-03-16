"""
Phase 3 Assignment Endpoints
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from buyer.models import Order
from rider.models import RiderProfile, RiderOrder
from rider.assignment_service import assign_order_to_riders, handle_rider_acceptance, handle_rider_rejection
from django.utils import timezone


# ==================== SELLER ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_order_ready_for_delivery(request, order_id):
    """
    Seller marks order as ready for delivery
    Triggers the assignment process
    """
    try:
        order = Order.objects.get(id=order_id, restaurant__seller__user=request.user)
    except Order.DoesNotExist:
        return Response(
            {'message': 'Order not found or you don\'t have permission'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check current status
    if order.status not in ['preparing', 'confirming']:
        return Response(
            {'message': f'Order cannot be marked ready from {order.status} status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update order status
    order.status = 'ready'
    order.save()
    
    # Start assignment process
    result = assign_order_to_riders(order)
    
    if result['success']:
        return Response({
            'message': 'Order ready! Finding riders...',
            'order_id': order.id,
            'distance_km': result['distance_km'],
            'delivery_fee': result['delivery_fee'],
            'rider_earning': result['rider_earning'],
            'assigned_riders_count': len(result['assigned_riders']),
            'status': 'pending_rider_acceptance'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'message': f'Could not assign rider: {result["reason"]}',
            'order_id': order.id
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== RIDER ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_orders(request):
    """
    Get list of available orders for the current rider
    (Orders assigned but not yet accepted)
    """
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get pending assignments for this rider with optimized queries
    pending_assignments = RiderOrder.objects.filter(
        rider=rider,
        status='assigned_pending'
    ).select_related('order', 'order__restaurant', 'order__buyer', 'order__buyer__user').prefetch_related('order__items')
    
    orders_data = []
    
    for assignment in pending_assignments:
        order = assignment.order
        
        # Check if assignment has timed out
        if order.assignment_timeout_at and timezone.now() > order.assignment_timeout_at:
            assignment.status = 'timeout'
            assignment.save()
            continue
        
        # Get buyer name
        buyer_name = 'Guest'
        if order.buyer and order.buyer.user:
            first_name = order.buyer.user.first_name or ''
            last_name = order.buyer.user.last_name or ''
            buyer_name = f"{first_name} {last_name}".strip() or order.buyer.user.username
        
        # Count order items
        items_count = order.items.count()
        
        # Parse estimated delivery time (e.g., "30-45 mins" -> 30)
        estimated_time_minutes = 30
        if order.restaurant and order.restaurant.delivery_time:
            try:
                time_str = order.restaurant.delivery_time.replace('mins', '').replace(' ', '')
                estimated_time_minutes = int(time_str.split('-')[0])
            except:
                estimated_time_minutes = 30
        
        orders_data.append({
            'id': order.id,
            'order_id': order.id,
            'restaurant_name': order.restaurant.name,
            'restaurant_address': order.restaurant.address,
            'restaurant_image': order.restaurant.image.url if order.restaurant.image else None,
            'buyer_name': buyer_name,
            'items_count': items_count,
            'order_total': float(order.total_price),
            'pickup_location': f"{order.restaurant.latitude}, {order.restaurant.longitude}",
            'dropoff_location': f"{order.delivery_latitude}, {order.delivery_longitude}",
            'delivery_address': order.delivery_address,
            'distance_km': float(order.distance_km) if order.distance_km else 0,
            'delivery_fee': float(order.delivery_fee),
            'estimated_earnings': float(order.rider_earning) if order.rider_earning else 0,
            'rider_earning': float(order.rider_earning) if order.rider_earning else 0,
            'estimated_time_minutes': estimated_time_minutes,
            'time_created': order.created_at.isoformat() if order.created_at else None,
            'time_remaining_seconds': int((order.assignment_timeout_at - timezone.now()).total_seconds()) if order.assignment_timeout_at else 0
        })
    
    return Response({
        'count': len(orders_data),
        'orders': orders_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_delivery_order(request, order_id):
    """
    Rider accepts a delivery order
    This locks the order and rejects others
    """
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if rider is verified and online
    if not rider.is_verified or not rider.is_online:
        return Response(
            {'message': 'You must be online and verified to accept orders'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if rider has pending assignment for this order
    try:
        assignment = RiderOrder.objects.get(
            order_id=order_id,
            rider=rider,
            status='assigned_pending'
        )
    except RiderOrder.DoesNotExist:
        return Response(
            {'message': 'No pending assignment for this order'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle acceptance
    result = handle_rider_acceptance(order_id, rider.id)
    
    if result['success']:
        return Response({
            'message': result['message'],
            'order_id': result['order_id'],
            'rider': result['rider'],
            'earning': result['earning'],
            'status': 'delivery_locked'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'message': f'Could not accept order: {result["reason"]}',
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_delivery_order(request, order_id):
    """
    Rider rejects a delivery order
    System tries next available rider
    """
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if rider has pending assignment for this order
    try:
        assignment = RiderOrder.objects.get(
            order_id=order_id,
            rider=rider,
            status='assigned_pending'
        )
    except RiderOrder.DoesNotExist:
        return Response(
            {'message': 'No pending assignment for this order'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle rejection
    result = handle_rider_rejection(order_id, rider.id)
    
    if result['success']:
        if 'next_rider' in result:
            return Response({
                'message': result['message'],
                'next_rider': result['next_rider']
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Order rejected, no more riders available',
                'order_id': order_id
            }, status=status.HTTP_200_OK)
    else:
        return Response({
            'message': f'Could not reject order: {result["reason"]}',
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== ADMIN ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_manually_assign_order(request, order_id):
    """
    Admin manual assignment endpoint
    For emergency manual assignment
    """
    # Check if user is admin/staff
    if not request.user.is_staff:
        return Response(
            {'message': 'Only admin can use this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        order = Order.objects.get(id=order_id)
        rider_id = request.data.get('rider_id')
        rider = RiderProfile.objects.get(id=rider_id)
    except (Order.DoesNotExist, RiderProfile.DoesNotExist):
        return Response(
            {'message': 'Order or Rider not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Manually assign
    result = handle_rider_acceptance(order_id, rider_id)
    
    if result['success']:
        return Response(result, status=status.HTTP_200_OK)
    else:
        return Response(
            {'message': result.get('reason', 'Assignment failed')},
            status=status.HTTP_400_BAD_REQUEST
        )
