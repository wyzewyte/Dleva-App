"""
Delivery Lifecycle API Endpoints
Handles all delivery transitions from pickup to final delivery.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from buyer.models import Order
from seller.models import SellerProfile, Restaurant
from rider.models import RiderProfile, RiderOrder
from .delivery_service import DeliveryService, DeliveryStateError


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def arrived_at_pickup(request, order_id):
    """
    Rider confirms arrival at restaurant pickup location.
    
    URL: POST /api/rider/order/<id>/arrived-at-pickup/
    Auth: Rider must be authenticated
    
    Response: 200 {success: true, message: "...", pickup_code: "..."}
    Error: 400 (invalid status/rider), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # DeliveryService will validate rider profile and status transitions
        result = DeliveryService.arrived_at_pickup(order_id, request.user.id)
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Internal error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_order(request, order_id):
    """
    Seller verifies pickup code and releases order for rider to pickup.
    
    URL: POST /api/rider/order/<id>/release/
    Auth: Seller/Restaurant owner
    Body: { "pickup_code": "ABC123" }
    
    Response: 200 {success: true, message: "..."}
    Error: 400 (invalid code/status), 403 (not seller), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get pickup code from request
        pickup_code = request.data.get('pickup_code', '').strip()
        if not pickup_code:
            return Response(
                {'error': 'pickup_code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            seller_profile = SellerProfile.objects.get(user=request.user)
        except SellerProfile.DoesNotExist:
            return Response(
                {'error': 'Seller profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )

        if order.restaurant.seller_id != seller_profile.id:
            return Response(
                {'error': 'Not allowed to release this order'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        result = DeliveryService.seller_release_order(order_id, pickup_code)
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Internal error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pickup_order(request, order_id):
    """
    Rider confirms pickup of order from restaurant.
    
    URL: POST /api/rider/order/<id>/pickup/
    Auth: Rider must be authenticated
    
    Response: 200 {success: true, destination: {...}}
    Error: 400 (invalid status/rider), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # DeliveryService will validate rider profile and status transitions
        result = DeliveryService.rider_pickup_order(order_id, request.user.id)
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Internal error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def on_the_way(request, order_id):
    """
    Rider confirms departure towards customer.
    
    URL: POST /api/rider/order/<id>/on-the-way/
    Auth: Rider must be authenticated
    
    Response: 200 {success: true, message: "..."}
    Error: 400 (invalid status/rider), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # DeliveryService will validate rider profile and status transitions
        result = DeliveryService.on_the_way(order_id, request.user.id)
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Internal error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delivery_attempted(request, order_id):
    """
    Rider reports delivery attempt but customer unreachable.
    Can repeat up to 3 times with backoff delays.
    
    URL: POST /api/rider/order/<id>/delivery-attempted/
    Auth: Rider must be authenticated
    Body: { "reason": "Customer not answering" }  (optional)
    
    Response: 200 {
        success: true, 
        attempt_number: 1,
        recommended_backoff_seconds: 60,
        next_attempt_available_at: "..."
    }
    Error: 400 (max attempts reached/invalid status), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        reason = request.data.get('reason', '')
        
        # DeliveryService will validate rider profile and status transitions
        result = DeliveryService.delivery_attempt(
            order_id, 
            request.user.id,
            reason=reason
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Internal error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_and_deliver(request, order_id):
    """
    Rider verifies confirmation code and completes delivery.
    Rider earning is automatically credited to wallet.
    
    URL: POST /api/rider/order/<id>/deliver/
    Auth: Rider must be authenticated
    Body: {
        "delivery_pin": "1234",
        "proof_photo_url": "https://..."  (optional)
    }
    
    Response: 200 {
        success: true,
        message: "Delivery completed - earning credited to wallet",
        rider_earning: "₦450.00",
        wallet_balance: "₦5000.00"
    }
    Error: 400 (invalid code/status), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        delivery_pin = request.data.get('delivery_pin', '').strip()
        if not delivery_pin:
            return Response(
                {'error': 'delivery_pin is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        proof_photo = request.FILES.get('proof_photo')
        
        # DeliveryService will validate rider profile and status transitions
        result = DeliveryService.verify_and_deliver(
            order_id,
            request.user.id,
            delivery_pin=delivery_pin,
            proof_photo=proof_photo
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Internal error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_delivery(request, order_id):
    """
    Cancel delivery order.
    
    Seller: Can cancel until rider picks up
    Rider: Can cancel anytime (loses eligibility)
    Admin: Can always cancel
    
    URL: POST /api/rider/order/<id>/cancel/
    Auth: Rider, Seller, or Admin
    Body: {
        "user_type": "rider|seller|admin",
        "reason": "..."  (optional)
    }
    
    Response: 200 {success: true, message: "..."}
    Error: 400 (invalid state/permissions), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.user.is_staff:
            user_type = 'admin'
        else:
            user_type = None
            try:
                rider = RiderProfile.objects.get(user=request.user)
                if order.rider_id == rider.id:
                    user_type = 'rider'
            except RiderProfile.DoesNotExist:
                pass

            if user_type is None:
                try:
                    seller_profile = SellerProfile.objects.get(user=request.user)
                    if order.restaurant.seller_id == seller_profile.id:
                        user_type = 'seller'
                except SellerProfile.DoesNotExist:
                    pass

        if user_type is None:
            return Response(
                {'error': 'Not authorized to cancel this order'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', '')
        
        result = DeliveryService.cancel_delivery(
            order_id,
            request.user.id,
            user_type=user_type,
            reason=reason
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_rider_location(request, order_id):
    """
    Update rider's current delivery location (GPS).
    Called every 20-30 seconds during delivery for real-time tracking.
    
    URL: POST /api/rider/order/<id>/update-location/
    Auth: Rider must be authenticated
    Body: {
        "latitude": 6.5244,
        "longitude": 3.3792
    }
    
    Response: 200 {
        success: true,
        message: "Location updated",
        updated_at: "..."
    }
    Error: 400 (invalid coords/status), 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is None or longitude is None:
            return Response(
                {'error': 'latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = DeliveryService.update_rider_location(
            order_id,
            request.user.id,
            float(latitude),
            float(longitude)
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except DeliveryStateError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except (ValueError, TypeError) as e:
        return Response(
            {'error': 'Invalid latitude/longitude format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def delivery_status(request, order_id):
    """
    Get detailed delivery status and timeline for an order.
    
    URL: GET /api/rider/order/<id>/delivery-status/
    Auth: Rider or Seller (can only see own orders)
    
    Response: 200 {
        order_id: 123,
        current_status: "on_the_way",
        timeline: {...},
        rider: {...},
        restaurant: {...},
        customer: {...}
    }
    Error: 404 (order not found)
    """
    try:
        # Verify order exists
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        result = DeliveryService.get_delivery_status(order_id)
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
