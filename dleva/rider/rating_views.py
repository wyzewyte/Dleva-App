"""
Phase 6: Rating and Performance Endpoints
Handles rating submission, performance stats, and admin dashboard
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from buyer.models import Order
from rider.models import RiderProfile
from rider.performance_service import PerformanceService, PerformanceError


# ============================================================================
# BUYER ENDPOINTS - Rating submission and viewing
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_rider_rating(request, order_id):
    """
    Buyer submits a rating for rider after delivery.
    
    Requirements:
    - Order must be delivered
    - Buyer must own the order
    - No existing rating for this order
    
    Triggers rating calculation and suspension check automatically.
    """
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Debug: Log request details
    print(f"\n=== RIDER RATING REQUEST ===")
    print(f"Order ID: {order_id}")
    print(f"Authenticated User: {request.user.id} ({request.user.username})")
    print(f"Order Buyer: {order.buyer.user.username if order.buyer else 'None'}")
    print(f"Order Status: {order.status}")
    print(f"Order Rider: {order.rider}")
    print(f"Rating: {request.data.get('rating')}")
    print(f"Comment: {request.data.get('comment', '')}")
    print(f"===========================\n")
    
    # Check buyer owns this order - improved error handling
    try:
        if not order.buyer:
            print(f"[ERROR] Order {order_id} has no buyer assigned")
            return Response(
                {'error': 'Order does not have a buyer assigned'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.buyer.user.id != request.user.id:
            print(f"[ERROR] User {request.user.id} tried to rate order {order_id} which belongs to user {order.buyer.user.id}")
            return Response(
                {'error': 'Not authorized to rate this order'},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError as e:
        print(f"[ERROR] AttributeError checking order buyer: {str(e)}")
        return Response(
            {'error': 'Unable to verify order ownership - corrupted order data'},
            status=status.HTTP_403_FORBIDDEN
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error checking order buyer: {str(e)}")
        return Response(
            {'error': 'Unable to verify order ownership'},
            status=status.HTTP_403_FORBIDDEN
        )

    if not order.rider:
        return Response(
            {'error': 'This order does not have a rider assigned yet'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check order is delivered
    if order.status != 'delivered':
        return Response(
            {'error': f'Cannot rate undelivered order (status: {order.status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate input
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')
    
    if not rating:
        return Response(
            {'error': 'Rating is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        rating = int(rating)
    except (ValueError, TypeError):
        return Response(
            {'error': 'Rating must be an integer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Submit rating
    try:
        result = PerformanceService.submit_rating(
            order_id=order.id,
            rider_id=order.rider.id,  # ✅ RiderProfile ID (needed for RiderRating FK)
            user_id=request.user.id,
            rating=rating,
            comment=comment
        )
        return Response(result, status=status.HTTP_201_CREATED)
    
    except PerformanceError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        import traceback
        print(f"[ERROR] Unexpected error in submit_rider_rating:")
        print(traceback.format_exc())
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rider_ratings(request, rider_id):
    """
    Get rating information and performance stats for a rider.
    
    Public endpoint - any authenticated user can view.
    """
    try:
        result = PerformanceService.get_rider_performance(rider_id)
        return Response(result, status=status.HTTP_200_OK)
    except PerformanceError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================================
# PERFORMANCE STATS ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rider_performance_stats(request, rider_id):
    """
    Get detailed performance metrics for a rider.
    
    Returns:
    - Average rating (1-5)
    - Acceptance rate (%)
    - On-time delivery rate (%)
    - Total deliveries
    - Account status
    - Warning/suspension status
    """
    try:
        result = PerformanceService.get_rider_performance(rider_id)
        return Response(result, status=status.HTTP_200_OK)
    except PerformanceError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================================
# ADMIN ENDPOINTS - Dashboard and management
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_get_all_riders_performance(request):
    """
    Admin endpoint: Get performance stats for all riders.
    
    Used for admin dashboard to view:
    - Riders sorted by rating
    - Acceptance and on-time rates
    - Suspension status
    """
    # TODO: Add is_staff check
    
    try:
        result = PerformanceService.get_all_riders_performance()
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_deactivate_rider(request, rider_id):
    """
    Admin permanently deactivates a rider.
    
    Used for fraud, theft, misconduct.
    Rider cannot login or work until restored.
    """
    # TODO: Add is_staff check
    
    reason = request.data.get('reason', 'No reason provided')
    
    try:
        result = PerformanceService.admin_deactivate_rider(
            rider_id=rider_id,
            admin_user=request.user,
            reason=reason
        )
        return Response(result, status=status.HTTP_200_OK)
    except PerformanceError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reactivate_rider(request, rider_id):
    """
    Admin reactivates a previously deactivated rider.
    
    Only works on deactivated riders.
    Suspended riders auto-reactivate after 7 days.
    """
    # TODO: Add is_staff check
    
    try:
        result = PerformanceService.admin_reactivate_rider(
            rider_id=rider_id,
            admin_user=request.user
        )
        return Response(result, status=status.HTTP_200_OK)
    except PerformanceError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_check_and_reactivate_suspended(request):
    """
    Admin endpoint to manually trigger auto-reactivation of suspended riders.
    
    Normally runs via scheduled task (Celery or cron).
    Can be triggered manually for testing.
    """
    # TODO: Add is_staff check
    
    try:
        result = PerformanceService.check_and_reactivate_suspended()
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
