"""
Phase 7: Real-Time Infrastructure API Views
Endpoints for WebSocket connections, notifications, and location tracking
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rider.models import RiderNotification, RiderProfile
from core.models import Location, LocationHistory
from rider.notification_service import PushNotificationService
from django.utils import timezone


# ============================================================================
# NOTIFICATION ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notifications(request):
    """
    Get count of unread notifications for current rider
    
    Response:
    {
        'unread_count': 3,
        'notifications': [...]
    }
    """
    try:
        from rider.models import RiderProfile
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'error': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    unread_count = PushNotificationService.get_unread_count(rider.id)
    recent = PushNotificationService.get_recent_notifications(rider.id, limit=5)
    
    notifications = [
        {
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        }
        for n in recent
    ]
    
    return Response({
        'unread_count': unread_count,
        'notifications': notifications,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark notification as read
    """
    try:
        PushNotificationService.mark_as_read(notification_id)
        return Response({
            'status': 'success',
            'message': 'Notification marked as read'
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all unread notifications as read for the current rider
    ✅ Better UX: Marks all at once when user opens the notification dropdown
    """
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'error': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        # Mark all unread notifications for this rider as read
        unread_count = rider.notifications.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'status': 'success',
            'message': f'Marked {unread_count} notification(s) as read',
            'marked_count': unread_count
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications_history(request):
    """
    Get notification history for rider
    Paginated, most recent first
    """
    try:
        from rider.models import RiderProfile
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'error': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    limit = int(request.query_params.get('limit', 20))
    offset = int(request.query_params.get('offset', 0))
    
    notifications = RiderNotification.objects.filter(
        rider=rider
    ).order_by('-created_at')[offset:offset+limit]
    
    data = [
        {
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
            'order_id': n.related_order_id,
        }
        for n in notifications
    ]
    
    return Response({
        'count': notifications.count(),
        'notifications': data,
    })


# ============================================================================
# LOCATION ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_location(request, rider_id):
    """
    Get current location of rider (for admin/tracking)
    
    Privacy: Only rider, admin, or buyer of active order can view
    Uses Phase 1 centralized Location system
    """
    try:
        rider = RiderProfile.objects.get(id=rider_id)
    except RiderProfile.DoesNotExist:
        return Response(
            {'error': 'Rider not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Privacy check: Can only view if:
    # - You are the rider
    # - You are admin
    if not request.user.is_staff:
        if request.user != rider.user:
            return Response(
                {'error': 'Not authorized to view this location'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Get rider's current location
    if not rider.current_location:
        return Response(
            {'error': 'Rider has not set location yet'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    location = rider.current_location
    return Response({
        'rider_id': rider.id,
        'address': location.address,
        'latitude': float(location.latitude),
        'longitude': float(location.longitude),
        'city': location.city,
        'area': location.area,
        'updated_at': location.updated_at.isoformat(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_fcm_token(request):
    """
    Register Firebase Cloud Messaging token for push notifications
    
    Request:
    {
        'fcm_token': 'token_from_firebase_client'
    }
    """
    try:
        from rider.models import RiderProfile
        
        fcm_token = request.data.get('fcm_token')
        if not fcm_token:
            return Response(
                {'error': 'FCM token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rider = RiderProfile.objects.get(user=request.user)
        # TODO: Add fcm_token field to RiderProfile.model
        # rider.fcm_token = fcm_token
        # rider.save()
        
        return Response({
            'status': 'success',
            'message': 'FCM token registered'
        })
    
    except RiderProfile.DoesNotExist:
        return Response(
            {'error': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# WEBSOCKET CONNECTION ENDPOINTS
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_location_tracking(request):
    """
    Endpoint to validate WebSocket connection
    Returns WebSocket connection details
    
    Response:
    {
        'url': 'ws://localhost:8000/ws/rider/location/{rider_id}/'
    }
    """
    try:
        from rider.models import RiderProfile
        rider = RiderProfile.objects.get(user=request.user)
        
        return Response({
            'status': 'ready',
            'ws_url': f'/ws/rider/location/{rider.id}/',
            'message': 'Connect to WebSocket at this URL',
            'protocol': 'Location updates every 20-30 seconds',
        })
    
    except RiderProfile.DoesNotExist:
        return Response(
            {'error': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_to_order(request, order_id):
    """
    Endpoint to validate WebSocket order subscription
    
    Response:
    {
        'url': 'ws://localhost:8000/ws/order/status/{order_id}/'
    }
    """
    from buyer.models import Order
    
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Privacy check
    if order.user != request.user and not request.user.is_staff:
        if not hasattr(request.user, 'seller_profile'):
            return Response(
                {'error': 'Not authorized to view this order'},
                status=status.HTTP_403_FORBIDDEN
            )
        if order.restaurant.owner != request.user:
            return Response(
                {'error': 'Not authorized to view this order'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    return Response({
        'status': 'ready',
        'ws_url': f'/ws/order/status/{order_id}/',
        'message': 'Connect to WebSocket for live updates',
        'updates': ['status_change', 'location_update', 'delivery_events'],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_rider_location(request):
    """
    Update rider's current location in real-time with reverse geocoding
    Used for distance calculations and finding nearest riders
    
    Body:
    {
        'latitude': 6.5244,
        'longitude': 3.3792,
        'accuracy': 25.5
    }
    
    Response:
    {
        'status': 'success',
        'message': 'Location updated',
        'address': '123 Street, City, State',
        'latitude': 6.5244,
        'longitude': 3.3792,
        'accuracy': 25.5
    }
    """
    try:
        from rider.models import RiderProfile, RiderLocation
        from core.location_service import LocationService
        
        print(f"📍 Location update request from user: {request.user}, authenticated: {request.user.is_authenticated}")
        print(f"📍 Request data: {request.data}")
        
        # Get rider profile
        rider = RiderProfile.objects.get(user=request.user)
        print(f"📍 Rider profile found: {rider.id}")
        
        # Extract location data
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        accuracy = request.data.get('accuracy', 0)
        
        print(f"📍 Extracted data: latitude={latitude}, longitude={longitude}, accuracy={accuracy}")
        
        # Validate coordinates
        try:
            latitude = float(latitude)
            longitude = float(longitude)
            accuracy = float(accuracy)
            print(f"✓ Converted to float: latitude={latitude}, longitude={longitude}, accuracy={accuracy}")
        except (TypeError, ValueError) as e:
            print(f"❌ Conversion error: {e}")
            return Response(
                {'error': f'Invalid latitude/longitude values: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate that values are not null/infinity
        if latitude is None or longitude is None or not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            print(f"❌ Coordinate validation failed: lat={latitude}, lng={longitude}")
            return Response(
                {'error': 'Coordinates out of valid range'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reverse geocode to get address
        address = None
        try:
            print(f"🔄 Reverse geocoding coordinates: {latitude}, {longitude}")
            geocode_result = LocationService.reverse_geocode(latitude, longitude)
            address = geocode_result.get('address', '')
            print(f"✓ Address retrieved: {address}")
        except Exception as e:
            print(f"⚠️ Reverse geocoding failed (non-critical): {str(e)}")
            address = None  # Continue without address, coordinates are still saved
        
        # Update RiderProfile with current location
        rider.current_latitude = latitude
        rider.current_longitude = longitude
        rider.location_accuracy = accuracy
        rider.last_location_update = timezone.now()
        # Update address if reverse geocoding succeeded
        if address:
            rider.address = address
        rider.save(update_fields=['current_latitude', 'current_longitude', 'location_accuracy', 'last_location_update', 'address'])
        print(f"✓ RiderProfile updated with address: {address}")
        
        # Update or create RiderLocation record
        try:
            rider_location = RiderLocation.objects.get(rider=rider)
            print(f"📍 Existing RiderLocation found")
        except RiderLocation.DoesNotExist:
            # Create new one only when we have valid coordinates
            rider_location = RiderLocation(
                rider=rider,
                latitude=latitude,
                longitude=longitude,
                accuracy=accuracy
            )
            print(f"📍 Creating new RiderLocation")
        
        # Always update with latest values
        rider_location.latitude = latitude
        rider_location.longitude = longitude
        rider_location.accuracy = accuracy
        rider_location.save()
        print(f"✓ RiderLocation saved: lat={rider_location.latitude}, lng={rider_location.longitude}")
        
        return Response({
            'status': 'success',
            'message': 'Location updated successfully',
            'address': address,  # Include the address in response
            'latitude': float(latitude),
            'longitude': float(longitude),
            'accuracy': float(accuracy),
            'timestamp': rider.last_location_update.isoformat()
        }, status=status.HTTP_200_OK)
        
    except RiderProfile.DoesNotExist:
        print(f"❌ RiderProfile.DoesNotExist for user: {request.user}")
        return Response(
            {'error': 'Rider profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"❌ Unexpected error in update_rider_location: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
