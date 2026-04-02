from decimal import Decimal
from math import radians, cos, sin, asin, sqrt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import parsers
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import (
    BuyerProfile, Cart, CartItem, 
    Order, OrderItem, Rating, Payment, WaitlistEntry
)
from .serializers import (
    BuyerProfileSerializer, RestaurantSerializer, MenuItemSerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, RatingSerializer
)
from seller.models import Restaurant, MenuItem, MenuItemCategory
from seller.serializers import MenuItemCategorySerializer

# ✅ PAYSTACK INTEGRATION
from utils.paystack_service import PaystackService, convert_to_kobo
import uuid
import logging

logger = logging.getLogger(__name__)




# ==================== PROFILE VIEWS ====================

class ProfileView(APIView):
    """Get and update buyer profile"""
    permission_classes = [IsAuthenticated]
    # ✅ Include JSONParser so application/json requests are accepted
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request):
        """Get user profile"""
        try:
            buyer_profile = BuyerProfile.objects.get(user=request.user)
            serializer = BuyerProfileSerializer(buyer_profile, context={'request': request})
            return Response(serializer.data)
        except BuyerProfile.DoesNotExist:
            return Response({
                'id': request.user.id,
                'name': request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'phone': '',
                'address': '',
                'latitude': None,
                'longitude': None,
                'image': None
            })

    def put(self, request):
        """Update user profile"""
        try:
            buyer_profile, created = BuyerProfile.objects.get_or_create(user=request.user)
            
            # Update User's name fields
            if 'name' in request.data:
                name_parts = request.data.get('name', '').split(' ', 1)
                request.user.first_name = name_parts[0]
                request.user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                request.user.save()
            
            # Update User's email
            if 'email' in request.data:
                request.user.email = request.data.get('email')
                request.user.save()
            
            # Update Profile fields
            if 'phone' in request.data:
                buyer_profile.phone = request.data.get('phone')
            if 'address' in request.data:
                buyer_profile.address = request.data.get('address')
            if 'latitude' in request.data:
                try:
                    buyer_profile.latitude = float(request.data.get('latitude'))
                except (ValueError, TypeError):
                    pass
            if 'longitude' in request.data:
                try:
                    buyer_profile.longitude = float(request.data.get('longitude'))
                except (ValueError, TypeError):
                    pass
            if 'image' in request.FILES:
                buyer_profile.image = request.FILES['image']
            
            buyer_profile.save()
            
            serializer = BuyerProfileSerializer(buyer_profile, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    # ✅ Support PATCH by delegating to the same update logic
    def patch(self, request):
        return self.put(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Old password and new password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Old password is incorrect'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_buyer(request):
    """Logout user - tokens cleared on frontend"""
    return Response({'message': 'Logged out successfully'})


# ==================== RESTAURANT VIEWS ====================

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

@api_view(['GET'])
@permission_classes([AllowAny])
def list_restaurants(request):
    """Get all restaurants with optional location filtering (within 5km)"""
    try:
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        
        restaurants = Restaurant.objects.all().order_by('name')
        
        # Search by name or description (not by category anymore - restaurants no longer have categories)
        search = request.GET.get('q')
        if search:
            restaurants = restaurants.filter(name__icontains=search)
        
        # Filter by distance (5km radius) if location provided
        MAX_DISTANCE_KM = 5
        if lat and lon:
            try:
                user_lat = float(lat)
                user_lon = float(lon)
                
                # Calculate distance for each restaurant and filter by 5km radius
                nearby_restaurants = []
                for restaurant in restaurants:
                    if restaurant.latitude and restaurant.longitude:
                        distance = haversine_distance(user_lat, user_lon, restaurant.latitude, restaurant.longitude)
                        if distance <= MAX_DISTANCE_KM:
                            nearby_restaurants.append(restaurant)
                
                restaurants = nearby_restaurants
            except (ValueError, TypeError):
                # If invalid coordinates, return all restaurants
                pass
        
        # Pagination
        limit = int(request.GET.get('limit', 20))
        offset = int(request.GET.get('offset', 0))
        
        total_count = len(restaurants) if isinstance(restaurants, list) else restaurants.count()
        paginated_restaurants = restaurants[offset:offset + limit]
        
        serializer = RestaurantSerializer(paginated_restaurants, many=True, context={'request': request})
        
        return Response({
            'count': total_count,
            'results': serializer.data,
            'limit': limit,
            'offset': offset
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_restaurant(request, restaurant_id):
    """Get a single restaurant by ID"""
    try:
        restaurant = Restaurant.objects.get(id=restaurant_id)
        serializer = RestaurantSerializer(restaurant, context={'request': request})
        return Response(serializer.data)
    except Restaurant.DoesNotExist:
        return Response(
            {'error': 'Restaurant not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


# ==================== MENU VIEWS ====================

class MenuItemListView(APIView):
    """Get menu items for a restaurant or search globally"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            restaurant_id = request.GET.get('restaurant')
            
            # Filter by restaurant if provided, otherwise get all available items
            if restaurant_id:
                menu_items = MenuItem.objects.filter(
                    restaurant_id=restaurant_id,
                    available=True
                )
            else:
                # Global search - get all available items
                menu_items = MenuItem.objects.filter(available=True)
            
            menu_items = menu_items.order_by('name')
            
            # Search by name or description
            search = request.GET.get('q')
            if search:
                from django.db.models import Q
                menu_items = menu_items.filter(
                    Q(name__icontains=search) | Q(description__icontains=search)
                )
            
            # Pagination
            limit = int(request.GET.get('limit', 20))
            offset = int(request.GET.get('offset', 0))
            
            total_count = menu_items.count()
            menu_items = menu_items[offset:offset + limit]
            
            serializer = MenuItemSerializer(menu_items, many=True, context={'request': request})
            
            return Response({
                'count': total_count,
                'results': serializer.data,
                'limit': limit,
                'offset': offset
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== CART VIEWS ====================

class CartListView(APIView):
    """Get cart items for current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            buyer_profile, created = BuyerProfile.objects.get_or_create(user=request.user)
            
            carts = Cart.objects.filter(buyer=buyer_profile)
            
            serializer = CartSerializer(carts, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class AddToCartView(APIView):
    """Add item to cart"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            menu_item_id = request.data.get('menu_item_id')
            quantity = int(request.data.get('quantity', 1))
            
            if not menu_item_id:
                return Response(
                    {'error': 'Menu item ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            menu_item = MenuItem.objects.get(id=menu_item_id)
            
            buyer_profile, created = BuyerProfile.objects.get_or_create(user=request.user)
            
            cart, created = Cart.objects.get_or_create(
                buyer=buyer_profile,
                restaurant=menu_item.restaurant
            )
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                menu_item=menu_item
            )
            
            if not created:
                cart_item.quantity += quantity
            else:
                cart_item.quantity = quantity
            
            cart_item.save()
            
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except MenuItem.DoesNotExist:
            return Response(
                {'error': 'Menu item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_cart(request, restaurant_id):
    """Clear cart items for a restaurant"""
    try:
        buyer_profile = BuyerProfile.objects.get(user=request.user)
        
        cart = Cart.objects.get(buyer=buyer_profile, restaurant_id=restaurant_id)
        CartItem.objects.filter(cart=cart).delete()
        
        return Response({'message': 'Cart cleared successfully'})
        
    except BuyerProfile.DoesNotExist:
        return Response(
            {'error': 'Buyer profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== ORDER VIEWS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    """
    ✅ SECURE FLOW: Validate cart & calculate totals (NO order creation yet)
    
    This endpoint:
    - Validates cart items exist and have correct prices
    - Calculates subtotal and total
    - Returns order meta data
    - Does NOT create order in database
    
    Order is only created AFTER payment is verified in PaymentCompleteView
    """
    from utils.address_validators import validate_address_coordinate_separation
    
    try:
        user = request.user
        restaurant_id = request.data.get('restaurant_id')
        payment_method = request.data.get('payment_method', 'card')
        delivery_fee = Decimal(request.data.get('delivery_fee', 500))
        delivery_address = request.data.get('delivery_address', '').strip()

        print(f"\n{'='*60}")
        print(f"🔍 VALIDATING CHECKOUT (NO ORDER CREATED YET)")
        print(f"{'='*60}")
        print(f"Restaurant ID: {restaurant_id}")
        print(f"Payment Method: {payment_method}")

        if not restaurant_id:
            return Response(
                {'error': 'Restaurant ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        buyer_profile = BuyerProfile.objects.get(user=user)
        
        # ✅ GET DELIVERY COORDINATES FROM REQUEST
        delivery_latitude = request.data.get('delivery_latitude')
        delivery_longitude = request.data.get('delivery_longitude')
        
        # Fallback to buyer's profile coordinates if not provided
        if not delivery_latitude and buyer_profile.latitude:
            delivery_latitude = buyer_profile.latitude
        if not delivery_longitude and buyer_profile.longitude:
            delivery_longitude = buyer_profile.longitude
        
        # ✅ VALIDATE ADDRESS/COORDINATE SEPARATION
        try:
            validate_address_coordinate_separation(delivery_address, delivery_latitude, delivery_longitude)
        except ValueError as e:
            return Response(
                {'error': f'Invalid delivery address: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"\nDelivery Coordinates:")
        print(f"  Latitude: {delivery_latitude}")
        print(f"  Longitude: {delivery_longitude}")
        
        # ✅ GET CART ITEMS FROM REQUEST
        cart_items_data = request.data.get('cartItems', [])
        
        print(f"\nCart items from FRONTEND request:")
        for item in cart_items_data:
            print(f"  - {item.get('name')} x {item.get('quantity')}")

        if not cart_items_data:
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ VALIDATE ALL MENU ITEMS EXIST (prevent price tampering)
        menu_item_ids = [item_data.get('id') for item_data in cart_items_data]
        menu_items_db = {item.id: item for item in MenuItem.objects.filter(id__in=menu_item_ids)}

        subtotal = Decimal('0')
        print(f"\nValidating items from DATABASE (Security):")
        
        validated_items = []
        
        for item_data in cart_items_data:
            menu_item_id = item_data.get('id')
            item_quantity = int(item_data.get('quantity', 1))
            
            menu_item = menu_items_db.get(menu_item_id)
            if not menu_item:
                return Response(
                    {'error': f'Menu item {menu_item_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            item_price = menu_item.price
            item_subtotal = item_price * item_quantity
            subtotal += item_subtotal
            
            validated_items.append({
                'menu_item': menu_item,
                'quantity': item_quantity,
                'price': item_price
            })
            
            print(f"  {menu_item.name}: {item_quantity} x {item_price} = {item_subtotal}")

        total_price = subtotal + delivery_fee

        print(f"\nTOTALS (FOR PAYMENT):")
        print(f"  Subtotal: {subtotal}")
        print(f"  Delivery Fee: {delivery_fee}")
        print(f"  TOTAL: {total_price}")

        # ✅ RETURN VALIDATION DATA (NOT creating order yet)
        validation_data = {
            'status': 'valid',
            'items': [
                {
                    'id': item['menu_item'].id,
                    'name': item['menu_item'].name,
                    'quantity': item['quantity'],
                    'price': float(item['price']),
                    'subtotal': float(item['price'] * item['quantity'])
                } for item in validated_items
            ],
            'subtotal': float(subtotal),
            'delivery_fee': float(delivery_fee),
            'total': float(total_price),
            'restaurant_id': restaurant_id,
            'delivery_address': delivery_address,
            'delivery_latitude': float(delivery_latitude) if delivery_latitude else None,
            'delivery_longitude': float(delivery_longitude) if delivery_longitude else None,
        }

        print(f"\n{'='*60}")
        print(f"✅ CHECKOUT VALIDATION COMPLETE (Order NOT created yet)")
        print(f"✅ User will proceed to payment")
        print(f"{'='*60}\n")

        return Response(validation_data, status=status.HTTP_200_OK)

    except MenuItem.DoesNotExist as e:
        print(f"❌ MenuItem not found: {e}")
        return Response(
            {'error': f'Menu item not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except BuyerProfile.DoesNotExist:
        return Response(
            {'error': 'Buyer profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Restaurant.DoesNotExist:
        return Response(
            {'error': 'Restaurant not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"\n❌ ERROR: {str(e)}")
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_orders(request):
    """Get all orders for the current buyer"""
    try:
        buyer_profile = BuyerProfile.objects.get(user=request.user)
        orders = Order.objects.filter(buyer=buyer_profile).order_by('-created_at')
        
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)
    except BuyerProfile.DoesNotExist:
        return Response(
            {'error': 'Buyer profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_status(request, order_id):
    """Get order details and status"""
    try:
        buyer_profile = BuyerProfile.objects.get(user=request.user)
        order = Order.objects.get(id=order_id, buyer=buyer_profile)
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
        
    except BuyerProfile.DoesNotExist:
        return Response(
            {'error': 'Buyer profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== RATING VIEWS ====================

class RateOrderView(APIView):
    """Submit rating for an order"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            order_id = request.data.get('order_id')
            rating = request.data.get('rating')
            comment = request.data.get('comment', '')
            
            if not order_id or not rating:
                return Response(
                    {'error': 'Order ID and rating are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            rating = int(rating)
            if rating < 1 or rating > 5:
                return Response(
                    {'error': 'Rating must be between 1 and 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            buyer_profile = BuyerProfile.objects.get(user=request.user)
            order = Order.objects.get(id=order_id, buyer=buyer_profile)
            
            rating_obj, created = Rating.objects.update_or_create(
                order=order,
                buyer=buyer_profile,
                defaults={
                    'rating': rating,
                    'comment': comment,
                    'restaurant': order.restaurant
                }
            )
            
            order.is_rated = True
            order.save()
            
            serializer = RatingSerializer(rating_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except BuyerProfile.DoesNotExist:
            return Response(
                {'error': 'Buyer profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== PAYMENT VIEWS ====================

class InitializePaymentView(APIView):
    """
    ✅ SECURE: Initialize payment WITHOUT requiring an order
    
    New Secure Flow:
    1. Frontend validates checkout
    2. Frontend calls this to initialize payment (no order yet)
    3. User pays on Paystack
    4. Paystack redirects to callback
    5. Callback verifies payment and creates order
    
    Accepts either:
    - order_id (old flow, for existing orders)
    - amount (new flow, for payment-first workflow)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser]

    def post(self, request, order_id=None):
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"🔄 INITIALIZING PAYMENT")
            logger.info(f"{'='*60}")
            logger.info(f"User: {request.user.email}")
            
            buyer_profile = BuyerProfile.objects.get(user=request.user)
            logger.info(f"✅ Buyer profile found")
            
            # ✅ GET AMOUNT - Either from existing order OR from request
            if order_id:
                # Old flow: Get amount from existing order
                logger.info(f"📋 OLD FLOW: Using existing order {order_id}")
                order = Order.objects.get(id=order_id, buyer=buyer_profile)
                payment = Payment.objects.get(order=order)
                amount_naira = payment.amount
                reference = f'DLV_{order.id}_{str(uuid.uuid4())[:8]}'
                metadata = {
                    'order_id': order.id,
                    'restaurant': order.restaurant.name,
                    'buyer_email': request.user.email,
                    'phone': buyer_profile.phone,
                    'address': order.delivery_address,
                }
                logger.info(f"✅ Order found: {order.id}, Amount: {amount_naira}")
                
                if payment.status != 'pending':
                    logger.error(f"❌ Payment already processed: {payment.status}")
                    return Response(
                        {'error': 'Payment has already been processed'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # New secure flow: Get amount from request
                logger.info(f"📋 NEW SECURE FLOW: Payment initialization only")
                amount_naira = Decimal(request.data.get('amount', 0))
                
                if amount_naira <= 0:
                    logger.error(f"❌ Invalid amount: {amount_naira}")
                    return Response(
                        {'error': 'Amount must be greater than 0'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                restaurant_id = request.data.get('restaurant_id')
                reference = f'DLV_{str(uuid.uuid4())[:16]}'  # No order_id in reference yet
                metadata = {
                    'restaurant_id': restaurant_id,
                    'buyer_email': request.user.email,
                    'phone': buyer_profile.phone,
                }
                logger.info(f"✅ Amount: ₦{amount_naira}")
            
            # ✅ VALIDATE AMOUNT EXISTS AND IS POSITIVE
            if not amount_naira or amount_naira <= 0:
                logger.error(f"❌ Invalid payment amount: {amount_naira}")
                return Response(
                    {'error': f'Invalid payment amount: {amount_naira}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"📋 Generated reference: {reference}")
            
            # ✅ Convert to kobo for Paystack
            try:
                amount_kobo = convert_to_kobo(amount_naira)
                logger.info(f"✅ Amount converted: {amount_naira} NGN -> {amount_kobo} kobo")
            except Exception as e:
                logger.error(f"❌ Error converting amount to kobo: {str(e)}")
                return Response(
                    {'error': f'Error processing amount: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Initialize payment with Paystack
            paystack_response = PaystackService.initialize_payment(
                email=request.user.email,
                amount_kobo=amount_kobo,
                reference=reference,
                metadata=metadata
            )
            
            logger.info(f"📤 Paystack Response: {paystack_response}")
            
            if not paystack_response.get('success'):
                error_msg = paystack_response.get('error', 'Payment initialization failed')
                logger.error(f"❌ Paystack initialization failed: {error_msg}")
                logger.error(f"   Full response: {paystack_response}")
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ VALIDATE PAYSTACK RESPONSE HAS REQUIRED FIELDS
            authorization_url = paystack_response.get('authorization_url')
            if not authorization_url:
                logger.error(f"❌ Paystack response missing authorization_url: {paystack_response}")
                return Response(
                    {'error': 'Payment gateway returned invalid response'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ Save payment reference (if old flow with existing order)
            if order_id:
                payment.reference = reference
                payment.status = 'pending'
                payment.save()
                logger.info(f"✅ Payment reference saved for Order {order.id}")
            
            logger.info(f"✅ Payment initialized: Reference {reference}")
            
            logger.info(f"{'='*60}\n")
            
            # Return Paystack authorization URL
            return Response({
                'status': 'success',
                'data': {
                    'authorization_url': authorization_url,
                    'access_code': paystack_response.get('access_code'),
                    'reference': reference,
                    'amount': float(amount_naira),
                }
            })
            
        except BuyerProfile.DoesNotExist:
            logger.error(f"❌ Buyer profile not found for user: {request.user}")
            return Response(
                {'error': 'Buyer profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Order.DoesNotExist:
            logger.error(f"❌ Order {order_id} not found for buyer")
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Payment.DoesNotExist:
            logger.error(f"❌ Payment record not found for order {order_id}")
            return Response(
                {'error': 'Payment record not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            logger.error(f"❌ Error initializing payment: {str(e)}")
            logger.error(f"   Traceback: {traceback.format_exc()}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyPaymentView(APIView):
    """Verify LIVE Paystack payment"""
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            buyer_profile = BuyerProfile.objects.get(user=request.user)
            order = Order.objects.get(id=order_id, buyer=buyer_profile)
            payment = Payment.objects.get(order=order)
            
            # Get reference from request
            reference = request.data.get('reference', '')
            
            if not reference:
                return Response(
                    {'error': 'Payment reference is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify payment with Paystack
            verification_result = PaystackService.verify_payment(reference)
            
            if not verification_result.get('success'):
                logger.error(f"❌ Verification error: {verification_result.get('error')}")
                return Response(
                    {'error': verification_result.get('error', 'Payment verification failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if payment was successful
            if verification_result.get('verified'):
                payment.reference = reference
                payment.status = 'completed'
                order.status = 'confirming'  # Move to next stage
                
                logger.info(f"✅ Payment verified for Order {order.id}")
            else:
                payment.status = 'failed'
                order.status = 'pending'
                logger.warning(f"⚠️ Payment failed for Order {order.id}: {verification_result.get('status')}")
            
            payment.save()
            order.save()
            
            serializer = OrderSerializer(order)
            return Response({
                'status': 'success',
                'data': serializer.data,
                'payment_verified': verification_result.get('verified'),
            })
            
        except BuyerProfile.DoesNotExist:
            return Response(
                {'error': 'Buyer profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment record not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"❌ Error verifying payment: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentCompleteView(APIView):
    """
    ✅ SECURE PAYMENT FLOW: Verify payment & create order
    
    Called AFTER user completes payment on Paystack
    Flow: User pays → Paystack redirects here → Verify → Create order
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser]

    def post(self, request):
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"🔄 COMPLETING PAYMENT & CREATING ORDER")
            logger.info(f"{'='*60}")
            
            # ✅ Get payment reference from Paystack callback
            reference = request.data.get('reference')
            if not reference:
                logger.error(f"❌ Missing payment reference")
                return Response(
                    {'error': 'Payment reference required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"✅ Payment reference: {reference}")
            
            # ✅ VERIFY PAYMENT WITH PAYSTACK
            verification_result = PaystackService.verify_payment(reference)
            logger.info(f"📤 Verification result: {verification_result}")
            
            if not verification_result.get('success'):
                logger.error(f"❌ Payment verification failed: {verification_result.get('error')}")
                return Response(
                    {'error': f"Payment verification failed: {verification_result.get('error')}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not verification_result.get('verified'):
                logger.error(f"❌ Payment not verified: {verification_result.get('status')}")
                return Response(
                    {'error': f"Payment was not completed. Status: {verification_result.get('status')}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"✅ Payment verified successfully!")
            
            # ✅ IDEMPOTENCY CHECK: If payment already exists, return existing order
            existing_payment = Payment.objects.filter(reference=reference).first()
            if existing_payment:
                logger.info(f"⚠️ Payment already processed, returning existing order {existing_payment.order.id}")
                serializer = OrderSerializer(existing_payment.order, context={'request': request})
                return Response({
                    'status': 'success',
                    'message': 'Payment already processed, returning existing order',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            
            # ✅ Now get order data from request (not from DB because order doesn't exist yet)
            buyer_profile = BuyerProfile.objects.get(user=request.user)
            restaurant_id = request.data.get('restaurant_id')
            delivery_address = request.data.get('delivery_address', '').strip()
            delivery_latitude = request.data.get('delivery_latitude')
            delivery_longitude = request.data.get('delivery_longitude')
            delivery_fee = Decimal(request.data.get('delivery_fee', 500))
            cart_items_data = request.data.get('cartItems', [])
            
            if not restaurant_id or not cart_items_data:
                logger.error(f"❌ Missing required order data")
                return Response(
                    {'error': 'Restaurant and cart items required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"📋 Creating order for restaurant {restaurant_id}")
            logger.info(f"📋 Delivery: {delivery_address}")
            logger.info(f"📋 Items: {len(cart_items_data)}")
            
            # ✅ FETCH AND VALIDATE MENU ITEMS (prevent price tampering)
            menu_item_ids = [item_data.get('id') for item_data in cart_items_data]
            menu_items_db = {item.id: item for item in MenuItem.objects.filter(id__in=menu_item_ids)}
            
            subtotal = Decimal('0')
            validated_items = []
            
            for item_data in cart_items_data:
                menu_item_id = item_data.get('id')
                item_quantity = int(item_data.get('quantity', 1))
                
                menu_item = menu_items_db.get(menu_item_id)
                if not menu_item:
                    logger.error(f"❌ Menu item {menu_item_id} not found")
                    return Response(
                        {'error': f'Menu item {menu_item_id} not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                item_price = menu_item.price
                item_subtotal = item_price * item_quantity
                subtotal += item_subtotal
                
                validated_items.append({
                    'menu_item': menu_item,
                    'quantity': item_quantity,
                    'price': item_price
                })
                logger.info(f"  ✓ {menu_item.name} x {item_quantity} @ ₦{item_price}")
            
            total_price = subtotal + delivery_fee
            logger.info(f"💰 Totals - Subtotal: ₦{subtotal}, Delivery: ₦{delivery_fee}, Total: ₦{total_price}")
            
            # ✅ CREATE ORDER (only after payment verified)
            restaurant = Restaurant.objects.get(id=restaurant_id)
            order = Order.objects.create(
                buyer=buyer_profile,
                restaurant=restaurant,
                delivery_address=delivery_address,
                delivery_latitude=delivery_latitude,
                delivery_longitude=delivery_longitude,
                total_price=total_price,
                delivery_fee=delivery_fee,
                payment_method='card',  # ✅ PAYSTACK ONLY
                status='pending'  # ✅ Payment verified, waiting for seller confirmation
            )
            
            logger.info(f"✅ Order created: {order.id}")
            
            # ✅ CREATE ORDER ITEMS
            order_items = [
                OrderItem(
                    order=order,
                    menu_item=item['menu_item'],
                    quantity=item['quantity'],
                    price=item['price']
                ) for item in validated_items
            ]
            OrderItem.objects.bulk_create(order_items)
            logger.info(f"✅ Order items created: {len(order_items)}")
            
            # ✅ CREATE PAYMENT RECORD
            payment = Payment.objects.create(
                order=order,
                amount=total_price,
                reference=reference,
                status='completed',  # ✅ ALREADY PAID
                provider='paystack'
            )
            logger.info(f"✅ Payment record created: {payment.id}")
            
            # ✅ CLEAR CART
            deleted_count, _ = CartItem.objects.filter(
                cart__buyer=buyer_profile,
                cart__restaurant_id=restaurant_id
            ).delete()
            logger.info(f"✅ Cleared {deleted_count} cart items")
            
            # ✅ RETURN ORDER DETAILS
            serializer = OrderSerializer(order, context={'request': request})
            
            logger.info(f"{'='*60}")
            logger.info(f"✅ PAYMENT & ORDER COMPLETE")
            logger.info(f"{'='*60}\n")
            
            return Response({
                'status': 'success',
                'message': 'Payment verified and order created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except BuyerProfile.DoesNotExist:
            logger.error(f"❌ Buyer profile not found")
            return Response(
                {'error': 'Buyer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Restaurant.DoesNotExist:
            logger.error(f"❌ Restaurant not found")
            return Response(
                {'error': 'Restaurant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            logger.error(f"❌ Error completing payment: {str(e)}")
            logger.error(f"   Traceback: {traceback.format_exc()}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])

@permission_classes([IsAuthenticated])
def save_location(request):
    """
    Save buyer's delivery location with proper address/coordinate separation.
    
    Expected payload:
    {
        "address": "123 Main Street, City, State",
        "latitude": 6.5244,
        "longitude": 3.3792
    }
    """
    from utils.address_validators import validate_address_coordinate_separation
    
    try:
        user = request.user
        address = request.data.get('address', '').strip()
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        # Validate address/coordinate separation
        validate_address_coordinate_separation(address, latitude, longitude)
        
        profile, _ = BuyerProfile.objects.get_or_create(user=user)
        profile.latitude = latitude
        profile.longitude = longitude
        profile.address = address
        profile.save()
        
        return Response({
            'status': 'ok',
            'profile': {
                'latitude': profile.latitude,
                'longitude': profile.longitude,
                'address': profile.address
            }
        })
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to save location: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== GPS TRACKING VIEWS ====================

class GpsLocationUpdateView(APIView):
    """
    Accept and store buyer's GPS location during delivery
    Called periodically by mobile/web client during active orders
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser]

    def post(self, request):
        """
        Update buyer's GPS location
        
        Expected data:
        {
            "latitude": 6.5244,
            "longitude": 3.3792,
            "accuracy": 15.5,
            "order_id": 123 (optional)
        }
        """
        try:
            from .locationHistoryService import LocationHistoryService
            
            user = request.user
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            accuracy = float(request.data.get('accuracy', 0))
            order_id = request.data.get('order_id')
            
            # Validate input
            if latitude is None or longitude is None:
                return Response(
                    {'error': 'Latitude and longitude are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                latitude = float(latitude)
                longitude = float(longitude)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid latitude or longitude'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get buyer profile
            buyer_profile = BuyerProfile.objects.get(user=user)
            
            # Save location
            location = LocationHistoryService.save_location(
                buyer_profile=buyer_profile,
                latitude=latitude,
                longitude=longitude,
                accuracy=accuracy,
                order_id=order_id
            )
            
            if location:
                return Response({
                    'status': 'saved',
                    'location': {
                        'id': location.id,
                        'latitude': float(location.latitude),
                        'longitude': float(location.longitude),
                        'accuracy': location.accuracy,
                        'recorded_at': location.recorded_at.isoformat(),
                        'is_live_tracking': location.is_live_tracking,
                    }
                })
            else:
                # Location not saved (duplicate/invalid), but still return 200
                return Response({
                    'status': 'ignored',
                    'reason': 'Location unchanged or outside accuracy threshold'
                })
        
        except BuyerProfile.DoesNotExist:
            return Response(
                {'error': 'Buyer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error updating location: {str(e)}")
            return Response(
                {'error': 'Failed to update location'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GpsLocationRetrieveView(APIView):
    """
    Retrieve buyer's current GPS location
    Used by rider to see where buyer is for accurate delivery
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current buyer location"""
        try:
            from .locationHistoryService import LocationHistoryService
            
            user = request.user
            order_id = request.query_params.get('order_id')
            
            buyer_profile = BuyerProfile.objects.get(user=user)
            location = LocationHistoryService.get_buyer_live_location(buyer_profile, order_id)
            
            if location:
                return Response({
                    'latitude': float(location.latitude),
                    'longitude': float(location.longitude),
                    'accuracy': location.accuracy,
                    'recorded_at': location.recorded_at.isoformat(),
                    'is_live_tracking': location.is_live_tracking,
                })
            else:
                return Response(
                    {'error': 'No location available'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        except BuyerProfile.DoesNotExist:
            return Response(
                {'error': 'Buyer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error retrieving location: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve location'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== ADDRESS VALIDATION VIEWS ====================

class AddressSearchView(APIView):
    """
    Search for addresses using Mapbox with caching
    Reduces API calls while providing fast address suggestions
    """
    permission_classes = [AllowAny]  # Public endpoint
    parser_classes = [parsers.JSONParser]

    def get(self, request):
        """
        Search for addresses by query string
        
        Query params:
            q: Search query (address, street, place name)
            limit: Max results (default: 5)
        """
        try:
            from .addressService import AddressService
            
            query = request.query_params.get('q', '').strip()
            limit = int(request.query_params.get('limit', 5))
            
            if not query or len(query) < 3:
                return Response(
                    {'error': 'Query must be at least 3 characters'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if limit > 10:
                limit = 10  # Cap at 10 results
            
            # Search addresses with caching
            results = AddressService.search_addresses(query)
            
            return Response({
                'query': query,
                'count': len(results),
                'results': results[:limit]
            })
        
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error searching addresses: {str(e)}")
            return Response(
                {'error': 'Address search failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReverseGeocodeView(APIView):
    """
    Convert coordinates to address
    Uses Mapbox reverse geocoding with caching
    """
    permission_classes = [AllowAny]
    parser_classes = [parsers.JSONParser]

    def post(self, request):
        """
        Reverse geocode coordinates to address
        
        Expected data:
        {
            "latitude": 6.5244,
            "longitude": 3.3792
        }
        """
        try:
            from .addressService import AddressService
            
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            
            if latitude is None or longitude is None:
                return Response(
                    {'error': 'Latitude and longitude are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                latitude = float(latitude)
                longitude = float(longitude)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid latitude or longitude'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate coordinates
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                return Response(
                    {'error': 'Coordinates out of valid range'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reverse geocode with caching
            address = AddressService.reverse_geocode(latitude, longitude)
            
            if address:
                return Response({
                    'success': True,
                    'address': address
                })
            else:
                return Response(
                    {'error': 'No address found for these coordinates'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error in reverse geocoding: {str(e)}")
            return Response(
                {'error': 'Reverse geocoding failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ValidateAddressView(APIView):
    """
    Validate address and get coordinates
    Ensures address is real and routable
    """
    permission_classes = [AllowAny]
    parser_classes = [parsers.JSONParser]

    def post(self, request):
        """
        Validate address and return coordinates
        
        Expected data:
        {
            "address": "123 Lagos Street, Victoria Island, Lagos"
        }
        """
        try:
            from .addressService import AddressService
            
            address = request.data.get('address', '').strip()
            
            if not address or len(address) < 5:
                return Response(
                    {'error': 'Address must be at least 5 characters'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate address
            is_valid, details = AddressService.validate_address(address)
            
            if is_valid and details:
                return Response({
                    'valid': True,
                    'address': address,
                    'display_name': details.get('display_name', ''),
                    'latitude': details.get('latitude'),
                    'longitude': details.get('longitude'),
                    'address_type': details.get('address_type'),
                })
            else:
                return Response({
                    'valid': False,
                    'message': 'Address could not be validated. Please check and try again.',
                    'suggestion': details.get('display_name') if details else None
                }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error validating address: {str(e)}")
            return Response(
                {'error': 'Address validation failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== MENU ITEM CATEGORIES ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def list_menu_item_categories(request):
    """Get all active menu item categories for sellers and buyers to use"""
    try:
        categories = MenuItemCategory.objects.filter(is_active=True).order_by('order', 'name')
        serializer = MenuItemCategorySerializer(categories, many=True)
        return Response({
            'count': categories.count(),
            'results': serializer.data
        })
    except Exception as e:
        logger.error(f"Error fetching menu item categories: {str(e)}")
        return Response(
            {'error': 'Failed to fetch categories'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



# Platform/location waitlist endpoint (no restaurant required)
from rest_framework.decorators import api_view, permission_classes
from .models import Waitlist

@api_view(['POST'])
@permission_classes([AllowAny])
def join_platform_waitlist(request):
    """
    POST /api/buyer/waitlist/
    Add user to platform/location waitlist (no vendors in area)
    """
    try:
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        address = request.data.get('address', '')
        email = request.data.get('email', None)
        phone = request.data.get('phone', None)

        if not latitude or not longitude or not address:
            return Response(
                {'error': 'latitude, longitude, and address are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        entry = Waitlist.objects.create(
            latitude=latitude,
            longitude=longitude,
            address=address,
            email=email,
            phone=phone
        )
        return Response({'message': 'Successfully joined waitlist', 'id': entry.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
