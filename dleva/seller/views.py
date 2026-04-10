from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import SellerProfile, MenuItem, Restaurant, Payout, PayoutDetails  # ✅ Add PayoutDetails
from buyer.models import Order, OrderItem, Payment, Rating
from .serializers import (
    SellerRegistrationSerializer,
    SellerProfileSerializer, 
    SellerMenuItemSerializer, 
    RestaurantSettingsSerializer,
    SellerProfileSettingsSerializer,
    PayoutSerializer,
    PayoutDetailsSerializer
)
from django.db.models import Sum, Count
from datetime import datetime, timedelta
from django.utils.timezone import now

# register seller
@api_view(['POST'])
@permission_classes([AllowAny])
def seller_register(request):
    """
    Register a new seller with username, first_name, last_name, and auto-create restaurant
    """
    serializer = SellerRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Check if username already exists
            if User.objects.filter(username=request.data.get('username')).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if email already exists
            if User.objects.filter(email=request.data.get('email')).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            seller_profile = serializer.save()
            
            # Get tokens
            user = seller_profile.user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Seller account created successfully! Your restaurant has been set up.',
                'seller_profile': SellerProfileSerializer(seller_profile).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# seller login
@api_view(['POST'])
@permission_classes([AllowAny])
def seller_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is not None:
        # optionally you can verify that user has a seller profile
        try:
            _ = user.seller_profile
        except SellerProfile.DoesNotExist:
            return Response({'error': 'This account is not a seller'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful',
            'user': user.username,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# get seller profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_seller_profile(request):
    try:
        profile = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = SellerProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)

# update seller profile
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_seller_profile(request):
    try:
        profile = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SellerProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# list all seller menu items for the current seller
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_menu_list(request):
    try:
        profile = request.user.seller_profile
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)

    # Get the restaurant linked to this seller
    try:
        restaurant = profile.restaurant
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not found. Please set up your restaurant first.'}, status=status.HTTP_404_NOT_FOUND)

    # Filter menu items by restaurant (the correct field)
    items = MenuItem.objects.filter(restaurant=restaurant)
    serializer = SellerMenuItemSerializer(items, many=True, context={'request': request})
    return Response(serializer.data)

# add a new menu item (seller owner only)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def seller_menu_add(request):
    user = request.user

    # Get seller profile
    try:
        seller_profile = user.seller_profile
    except:
        return Response({'error': 'Seller profile not found'}, status=404)
    
    #ensure seller has a restaurant
    if not hasattr(seller_profile, 'restaurant'):
        return Response({'error': 'Restaurant not yet created yet'}, status=400)
    
    restaurant = seller_profile.restaurant

    #Create Serilaizer
    serializer = SellerMenuItemSerializer(data=request.data)
    if serializer.is_valid():
        # Assign restaurant automatically here
        serializer.save(restaurant=restaurant)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# update menu item (only owner)
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def seller_menu_update(request, pk):
    try:
        profile = request.user.seller_profile
        restaurant = profile.restaurant
    except (SellerProfile.DoesNotExist, Restaurant.DoesNotExist):
        return Response({'error': 'Seller profile or restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        item = MenuItem.objects.get(id=pk, restaurant=restaurant)
    except MenuItem.DoesNotExist:
        return Response({'error': 'Menu item not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SellerMenuItemSerializer(item, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# delete menu item (only owner)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def seller_menu_delete(request, pk):
    try:
        profile = request.user.seller_profile
        restaurant = profile.restaurant
    except (SellerProfile.DoesNotExist, Restaurant.DoesNotExist):
        return Response({'error': 'Seller profile or restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        item = MenuItem.objects.get(id=pk, restaurant=restaurant)
    except MenuItem.DoesNotExist:
        return Response({'error': 'Menu item not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)

    item.delete()
    return Response({'message': 'Menu item deleted'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_restaurant(request):
    user = request.user
    try:
        seller_profile = user.seller_profile
    except:
        return Response({'error': 'Seller profile not found'}, status=404)

    # Prevent multiple restaurants per seller
    if hasattr(seller_profile, 'restaurant'):
        return Response({'error': 'You already created a restaurant'}, status=400)

    data = request.data.copy()
    serializer = RestaurantSettingsSerializer(data=data)

    if serializer.is_valid():
        restaurant = serializer.save(seller=seller_profile)
        return Response(RestaurantSettingsSerializer(restaurant).data, status=201)

    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_orders(request):
    user = request.user

    # get seller profile
    try:
        seller_profile = user.seller_profile
    except:
        return Response({'error': 'Seller profile not found'}, status=404)

    # get restaurant of seller
    if not hasattr(seller_profile, 'restaurant'):
        return Response({'error': 'Restaurant not found for this seller'}, status=404)

    restaurant = seller_profile.restaurant

    # filter orders for this restaurant
    orders = Order.objects.filter(restaurant=restaurant).order_by('-created_at')

    # Build response
    data = []
    for order in orders:
        # Get buyer information
        buyer = order.buyer  # This is BuyerProfile
        buyer_user = buyer.user if buyer else None
        
        items = []
        for item in order.items.all():
            subtotal = float(item.price) * item.quantity
            items.append({
                "menu_item": item.menu_item.name,
                "quantity": item.quantity,
                "price": float(item.price),
                "subtotal": subtotal
            })

        # Get rider information if assigned
        rider_data = None
        if order.rider:
            rider_data = {
                "id": order.rider.id,
                "full_name": order.rider.full_name,
                "phone_number": order.rider.phone_number,
                "vehicle_type": order.rider.vehicle_type,
                "vehicle_plate_number": order.rider.vehicle_plate_number,
                "rating": float(order.rider.average_rating) if order.rider.average_rating else 4.8,
            }

        data.append({
            "id": order.id,
            # ✅ BUYER DETAILS
            "customer_name": buyer_user.first_name or buyer_user.username if buyer_user else "Unknown",
            "customer_phone": buyer.phone if buyer else "N/A",
            "customer_address": buyer.address if buyer else "N/A",
            # ✅ ORDER INFO
            "status": order.status,
            "delivery_fee": float(order.delivery_fee),
            "total_price": float(order.total_price),
            "items": items,
            # ✅ RIDER INFO (NEW)
            "rider": rider_data,
            "created_at": str(order.created_at),
        })

    return Response(data, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def seller_update_order_status(request, order_id):
    user = request.user

    # ensure seller
    try:
        seller_profile = user.seller_profile
    except:
        return Response({'error': 'Seller profile not found'}, status=404)

    if not hasattr(seller_profile, 'restaurant'):
        return Response({'error': 'Restaurant not found for this seller'}, status=404)

    restaurant = seller_profile.restaurant

    # find order belonging to this seller's restaurant
    try:
        order = Order.objects.get(id=order_id, restaurant=restaurant)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or not allowed'}, status=404)

    new_status = request.data.get('status')

    # ✅ UPDATED: Sellers can only update to: confirming, preparing, cancelled
    # available_for_pickup is handled by mark_order_ready_for_delivery endpoint
    allowed_statuses = ['confirming', 'preparing', 'cancelled']

    if new_status not in allowed_statuses:
        return Response({'error': 'Invalid status'}, status=400)

    # update order
    order.status = new_status
    order.save()

    # Notify rider side when order is available for pickup
    if new_status == "available_for_pickup":
        # (Add real rider notification later)
        print("Order available for pickup - starting rider assignment")

    return Response({"message": f"Order status updated to {new_status}"}, status=200)


# Seller Analytics
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_analytics(request):
    user = request.user

    # Ensure seller profile exists
    try:
        seller_profile = SellerProfile.objects.get(user=user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=404)

    # Ensure restaurant exists
    if not hasattr(seller_profile, 'restaurant'):
        return Response({'error': 'Restaurant not set up'}, status=400)

    restaurant = seller_profile.restaurant

    # All orders belonging to seller's restaurant
    orders = Order.objects.filter(restaurant=restaurant)

    # Active orders: pending, confirming, preparing, available_for_pickup, awaiting_rider, assigned
    active_orders = orders.filter(status__in=['pending', 'confirming', 'preparing', 'available_for_pickup', 'awaiting_rider', 'assigned']).count()

    # Completed orders: ONLY delivered status
    completed_orders = orders.filter(status='delivered').count()

    # Total earnings: sum of FOOD cost only (total_price - delivery_fee) for delivered orders
    # delivery_fee is split 60% rider + 40% platform, NOT part of seller earnings
    delivered_orders = orders.filter(status='delivered')
    total_earnings = sum(order.total_price - order.delivery_fee for order in delivered_orders)

    # Top-selling menu items: ONLY from delivered orders
    top_items = (
        OrderItem.objects.filter(order__restaurant=restaurant, order__status='delivered')
        .values("menu_item__name")
        .annotate(total_sold=Sum("quantity"))
        .order_by("-total_sold")[:5]
    )

    # Repeat customers - count buyers with 2+ orders (any status)
    repeat_customers = (
        orders.values("buyer")
        .annotate(order_count=Count("id"))
        .filter(order_count__gte=2)
        .count()
    )

    # Today's stats - reset every day at 00:00
    today = now().date()
    
    # Today's orders: ALL orders created today (any status)
    todays_orders = orders.filter(created_at__date=today).count()
    
    # Today's earnings: ONLY from delivered orders created today (food cost minus delivery fee)
    todays_delivered = orders.filter(status='delivered', created_at__date=today)
    todays_earnings = sum(order.total_price - order.delivery_fee for order in todays_delivered)

    response_data = {
        "total_orders": active_orders,
        "completed_orders": completed_orders,
        "total_earnings": float(total_earnings),
        "top_selling_items": list(top_items),
        "repeat_customers": repeat_customers,
        "today": {
            "orders": todays_orders,  # ✅ ALL orders created today, any status
            "earnings": float(todays_earnings),  # ✅ Only delivered orders earnings
        },
        "restaurant_name": restaurant.name,
    }

    return Response(response_data, status=200)

# Payments and Payouts Tracking
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_payments(request):
    user = request.user

    try:
        seller_profile = user.seller_profile
    except:
        return Response({"error": "Seller profile not found"}, status=404)

    # Ensure seller has a restaurant
    if not hasattr(seller_profile, "restaurant"):
        return Response({"error": "Restaurant not found for this seller"}, status=404)

    restaurant = seller_profile.restaurant

    # Get orders for this restaurant
    orders = Order.objects.filter(restaurant=restaurant)

    # Get payments related to those orders
    payments = Payment.objects.filter(order__in=orders).order_by("-created_at")

    result = []
    for pay in payments:
        result.append({
            "order_id": pay.order.id,
            "amount": float(pay.amount),
            "status": pay.status,          # e.g. "paid", "pending"
            "provider": pay.provider,      # paystack, flutterwave
            "reference": pay.reference,
            "created_at": pay.created_at,
        })

    return Response(result, status=200)

# Rating and Review
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_reviews(request):
    user = request.user

    # Ensure seller exists
    try:
        seller_profile = user.seller_profile
    except:
        return Response({"error": "Seller profile not found"}, status=404)

    # Ensure restaurant exists
    if not hasattr(seller_profile, "restaurant"):
        return Response({"error": "Restaurant not found"}, status=404)

    restaurant = seller_profile.restaurant

    # Get all orders of this seller
    orders = Order.objects.filter(restaurant=restaurant)

    # Get all ratings for those orders
    ratings = Rating.objects.filter(order__in=orders).order_by('-created_at')

    # Build response
    data = []
    for r in ratings:
        data.append({
            "rating": r.rating,                # numeric rating
            "comment": r.comment,              # buyer message
            "buyer": r.order.buyer.user.username if r.order.buyer and r.order.buyer.user else "Guest",
            "order_id": r.order.id,
            "order_date": r.order.created_at,
            "created_at": r.created_at
        })

    return Response(data, status=200)

# Get restaurant details
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_restaurant(request):
    try:
        seller_profile = SellerProfile.objects.get(user=request.user)
        restaurant = seller_profile.restaurant
        serializer = RestaurantSettingsSerializer(restaurant)
        return Response(serializer.data)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=404)
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not set up'}, status=404)

# Update restaurant
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_restaurant(request):
    try:
        seller_profile = SellerProfile.objects.get(user=request.user)
        restaurant = seller_profile.restaurant
        
        serializer = RestaurantSettingsSerializer(restaurant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=404)
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not set up'}, status=404)

# Get payout details
@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_payout_details(request):
    """
    Get or update payout details for the seller.
    """
    try:
        seller_profile = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=404)

    if request.method == 'GET':
        try:
            payout_details = PayoutDetails.objects.get(seller=seller_profile)
            serializer = PayoutDetailsSerializer(payout_details)
            return Response(serializer.data)
        except PayoutDetails.DoesNotExist:
            return Response(None, status=200)

    elif request.method in ['POST', 'PATCH']:
        try:
            payout_details = PayoutDetails.objects.get(seller=seller_profile)
            serializer = PayoutDetailsSerializer(payout_details, data=request.data, partial=True)
        except PayoutDetails.DoesNotExist:
            serializer = PayoutDetailsSerializer(data=request.data)
        
        if serializer.is_valid():
            payout_details = serializer.save(seller=seller_profile)
            return Response(serializer.data, status=201 if request.method == 'POST' else 200)
        
        return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_restaurant(request):
    """
    Initial restaurant setup endpoint.
    Creates or retrieves restaurant for seller.
    """
    try:
        seller_profile = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=404)

    # Check if restaurant already exists
    if hasattr(seller_profile, 'restaurant') and seller_profile.restaurant:
        serializer = RestaurantSettingsSerializer(seller_profile.restaurant)
        return Response({'message': 'Restaurant already exists', 'data': serializer.data}, status=200)

    # Create new restaurant
    try:
        restaurant = Restaurant.objects.create(
            seller=seller_profile,
            name=request.data.get('name', f"{seller_profile.user.username}'s Restaurant"),
            description=request.data.get('description', ''),
            category=request.data.get('category', 'General'),
            is_active=request.data.get('is_active', True),
        )
        
        if 'image' in request.FILES:
            restaurant.image = request.FILES['image']
            restaurant.save()

        serializer = RestaurantSettingsSerializer(restaurant)
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_payouts(request):
    """
    Get all payouts for the seller.
    """
    try:
        seller_profile = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=404)

    payouts = Payout.objects.filter(seller=seller_profile).order_by('-created_at')
    serializer = PayoutSerializer(payouts, many=True)
    return Response(serializer.data)


# ==================== PHASE 3: ASSIGNMENT ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_order_ready_for_delivery(request, order_id):
    """
    Seller marks order as ready for delivery
    Triggers the automatic rider assignment process
    
    ✅ FIXED: Uses database transaction to ensure status only changes if assignment succeeds
    """
    from rider.assignment_service import assign_order_to_riders
    from django.db import transaction
    
    try:
        seller_profile = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response(
            {'message': 'Seller profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        order = Order.objects.get(id=order_id, restaurant__seller=seller_profile)
    except Order.DoesNotExist:
        return Response(
            {'message': 'Order not found or you don\'t have permission'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check current status - can only mark ready when preparing
    if order.status != 'preparing':
        return Response(
            {'message': f'Order can only be marked ready when in "preparing" status (current: {order.status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if order has delivery address
    if not (order.delivery_latitude and order.delivery_longitude):
        return Response(
            {'message': 'Order missing delivery address coordinates'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if restaurant has valid location coordinates
    restaurant = order.restaurant
    if not (restaurant.latitude and restaurant.longitude):
        return Response(
            {'message': '❌ Restaurant location not set. Please update restaurant address and coordinates in settings.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        with transaction.atomic():
            # ✅ FIXED: Validate assignment BEFORE changing status
            # Pre-calculate metrics to catch errors early
            from rider.assignment_service import (
                calculate_distance,
                calculate_delivery_fee,
                calculate_rider_earning,
                find_eligible_riders,
                validate_assignment_metrics
            )
            
            # Verify basic requirements
            distance_km = calculate_distance(
                restaurant.latitude,
                restaurant.longitude,
                order.delivery_latitude,
                order.delivery_longitude
            )
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
                return Response({
                    'message': f'❌ {metrics_validation["reason"]}',
                    'order_id': order.id,
                    'reason': 'Invalid delivery metrics'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if eligible riders exist BEFORE changing status
            eligible_riders = find_eligible_riders(order, max_distance=15)
            if not eligible_riders:
                return Response({
                    'message': f'❌ No available riders found within 15km. Distance: {distance_km:.1f}km',
                    'order_id': order.id,
                    'reason': 'No eligible riders'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Now that we know assignment will work, update status
            order.status = 'available_for_pickup'
            order.assignment_timeout_retry_count = 0
            order.save()
            
            # Start assignment process (should not fail now)
            result = assign_order_to_riders(order)
            
            if result['success']:
                return Response({
                    'message': '✅ Order ready! Finding best riders for you...',
                    'order_id': order.id,
                    'distance_km': result['distance_km'],
                    'delivery_fee': result['delivery_fee'],
                    'rider_earning': result['rider_earning'],
                    'platform_commission': float(result.get('platform_commission', 0)) if isinstance(result.get('platform_commission'), (int, float)) else 0,
                    'assigned_riders_count': len(result['assigned_riders']),
                    'timeout_seconds': 30,
                    'status': 'pending_rider_acceptance'
                }, status=status.HTTP_200_OK)
            else:
                # This shouldn't happen,  but handle it gracefully
                # Transaction will rollback the status change
                return Response({
                    'message': f'❌ Rider assignment failed: {result["reason"]}',
                    'order_id': order.id,
                    'reason': result['reason']
                }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        # Catch any unexpected errors and return without changing status
        print(f"[ERROR] mark_order_ready_for_delivery failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'message': f'❌ An error occurred: {str(e)}',
            'order_id': order.id,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== PHASE 7: NOTIFICATIONS ====================

from seller.notification_service import SellerPushNotificationService
from core.push_tokens import register_push_token, unregister_push_token
from seller.models import SellerNotification

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_seller_notifications(request):
    """
    Get seller's notifications (new orders, order updates, etc.)
    """
    try:
        seller = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response(
            {'message': 'Seller profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get limit from query params (default 20)
    limit = int(request.query_params.get('limit', 20))
    
    # Get notifications
    notifications = SellerNotification.objects.filter(
        seller=seller
    ).order_by('-created_at')[:limit]
    
    notifications_data = []
    for n in notifications:
        notifications_data.append({
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'is_sent': n.is_sent,
            'order_id': n.related_order_id,
            'data': n.data,
            'created_at': n.created_at.isoformat(),
            'read_at': n.read_at.isoformat() if n.read_at else None,
        })
    
    return Response({
        'count': len(notifications_data),
        'unread_count': SellerPushNotificationService.get_unread_count(seller.id),
        'notifications': notifications_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, notification_id):
    """
    Mark a notification as read
    """
    try:
        seller = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response(
            {'message': 'Seller profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        notification = SellerNotification.objects.get(
            id=notification_id,
            seller=seller
        )
    except SellerNotification.DoesNotExist:
        return Response(
            {'message': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Mark as read
    SellerPushNotificationService.mark_as_read(notification_id)
    
    return Response({
        'message': 'Notification marked as read',
        'notification_id': notification_id
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notification_count(request):
    """
    Get count of unread notifications for seller
    """
    try:
        seller = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response(
            {'message': 'Seller profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    unread_count = SellerPushNotificationService.get_unread_count(seller.id)
    
    return Response({
        'unread_count': unread_count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_seller_fcm_token(request):
    """
    Update seller's FCM token for push notifications
    
    Frontend calls:
    POST /api/seller/update-fcm-token/
    {
        "fcm_token": "eXdFb..."
    }
    """
    from django.utils import timezone
    
    try:
        seller = SellerProfile.objects.get(user=request.user)
    except SellerProfile.DoesNotExist:
        return Response(
            {'message': 'Seller profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    action = request.data.get('action', 'register')
    fcm_token = request.data.get('fcm_token')

    if action == 'unregister':
        unregister_push_token(seller, token=fcm_token)
        return Response({
            'message': 'FCM token removed successfully',
            'token_registered': False,
            'updated_at': seller.fcm_token_updated_at.isoformat()
        }, status=status.HTTP_200_OK)

    if not fcm_token:
        return Response(
            {'error': 'FCM token is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    register_push_token(seller, fcm_token)
    
    return Response({
        'message': 'FCM token updated successfully',
        'token_registered': True,
        'updated_at': seller.fcm_token_updated_at.isoformat()
    }, status=status.HTTP_200_OK)

