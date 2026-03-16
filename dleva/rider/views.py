from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, generics
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q
from datetime import datetime

from .models import RiderProfile, RiderDocument, RiderBankDetails, RiderOTP, RiderWallet, RiderTransaction, RiderServiceArea
from .serializers import (
    RiderProfileSerializer, RiderProfileUpdateSerializer, 
    RiderDocumentUploadSerializer, RiderBankDetailsSerializer,
    RiderVerificationStatusSerializer
)


# ==================== AUTH ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_rider(request):
    """Logout rider"""
    return Response({
        'message': 'Logged out successfully.'
    }, status=status.HTTP_200_OK)


# ==================== PROFILE ====================

class ProfileView(APIView):
    """Get and update rider profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current rider profile"""
        try:
            rider = RiderProfile.objects.get(user=request.user)
        except RiderProfile.DoesNotExist:
            return Response(
                {'message': 'Rider profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RiderProfileSerializer(rider)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Update rider profile"""
        try:
            rider = RiderProfile.objects.get(user=request.user)
        except RiderProfile.DoesNotExist:
            return Response(
                {'message': 'Rider profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RiderProfileUpdateSerializer(rider, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Recalculate profile completion
            rider.calculate_profile_completion()
            rider.save()
            
            return Response({
                'message': 'Profile updated successfully.',
                'profile': RiderProfileSerializer(rider).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verification_status(request):
    """Get rider verification status"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check what's completed
    phone_verified = rider.phone_verified
    documents_approved = rider.documents.filter(status='approved').exists()
    bank_details_added = hasattr(rider, 'bank_details') and rider.bank_details is not None
    
    # ✅ Get all documents with their individual statuses (for frontend to verify ALL are approved)
    all_documents = rider.documents.all()
    documents = {}
    for doc in all_documents:
        documents[doc.document_type] = {
            'status': doc.status,
            'document_type': doc.document_type,
            'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            'file_url': doc.file.url if doc.file else None,
            'rejection_reason': doc.rejection_reason or None,
        }
    
    # Calculate completion
    rider.calculate_profile_completion()
    
    blocked_reasons = get_blocked_reasons(rider)
    
    data = {
        'account_status': rider.account_status,
        'verification_status': rider.verification_status,
        'phone_verified': phone_verified,
        'documents_approved': documents_approved,
        'documents': documents,  # ✅ NEW: Include detailed documents array
        'bank_details_added': bank_details_added,
        'profile_completion_percent': rider.profile_completion_percent,
        'can_go_online': can_go_online(rider),
        'blocked_reasons': blocked_reasons,
        'is_online': rider.is_online
    }
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_online_status(request):
    """Toggle rider online/offline status"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if rider can go online
    is_online = request.data.get('is_online', False)
    if is_online and not can_go_online(rider):
        blocked_reasons = get_blocked_reasons(rider)
        return Response({
            'message': 'Cannot go online. Complete all requirements.',
            'blocked_reasons': blocked_reasons
        }, status=status.HTTP_403_FORBIDDEN)
    
    rider.is_online = is_online
    rider.save()
    
    return Response({
        'message': f'Rider is now {"online" if rider.is_online else "offline"}.',
        'is_online': rider.is_online
    }, status=status.HTTP_200_OK)


# ==================== DOCUMENTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_document(request):
    """Upload rider document"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = RiderDocumentUploadSerializer(data=request.data)
    if serializer.is_valid():
        document = serializer.save(rider=rider)
        rider.account_status = 'under_review'
        rider.save()
        
        return Response({
            'message': 'Document uploaded successfully.',
            'document_id': document.id,
            'status': document.status,
            'next_step': 'wait_for_admin_review'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_status(request):
    """Get document status"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    documents = rider.documents.all()
    documents_data = []
    
    for doc in documents:
        doc_data = {
            'id': doc.id,
            'document_type': doc.document_type,
            'status': doc.status,
            'uploaded_at': doc.uploaded_at,
            'reviewed_at': doc.reviewed_at
        }
        
        if doc.status == 'rejected' and doc.rejection_reason:
            doc_data['rejection_reason'] = doc.rejection_reason
        
        documents_data.append(doc_data)
    
    return Response({
        'documents': documents_data,
        'all_approved': all(d['status'] == 'approved' for d in documents_data) if documents_data else False
    }, status=status.HTTP_200_OK)


# ==================== BANK DETAILS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_bank_details(request):
    """Add or update bank details"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = RiderBankDetailsSerializer(data=request.data)
    if serializer.is_valid():
        bank_details, created = RiderBankDetails.objects.update_or_create(
            rider=rider,
            defaults=serializer.validated_data
        )
        
        # Recalculate profile completion
        rider.calculate_profile_completion()
        rider.save()
        
        return Response({
            'message': 'Bank details saved successfully.',
            'is_new': created,
            'profile_completion_percent': rider.profile_completion_percent
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bank_details(request):
    """Get rider bank details (masked)"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        bank_details = rider.bank_details
        return Response({
            'bank_name': bank_details.bank_name,
            'account_name': bank_details.account_name,
            'account_number_masked': '*' * (len(bank_details.account_number) - 4) + bank_details.account_number[-4:],
            'verified': bank_details.verified
        }, status=status.HTTP_200_OK)
    except RiderBankDetails.DoesNotExist:
        return Response(
            {'message': 'Bank details not set. Please add your bank details.'},
            status=status.HTTP_404_NOT_FOUND
        )


# ==================== ORDERS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_rider_orders(request):
    """Get rider orders - active orders or history based on status parameter"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    from buyer.models import Order
    
    # Get status filter from query params (for history filtering)
    status_filter = request.query_params.get('status', None)
    
    if status_filter:
        # If status is specified, use it for filtering (for order history)
        orders = Order.objects.filter(
            rider=rider,
            status=status_filter
        ).order_by('-created_at')
    else:
        # Default: Only show ACTIVE orders (currently being worked on)
        # Exclude completed orders: delivered, cancelled, delivery_attempted
        active_statuses = ['assigned', 'arrived_at_pickup', 'picked_up', 'on_the_way']
        orders = Order.objects.filter(
            rider=rider,
            status__in=active_statuses
        ).order_by('-created_at')
    
    orders_data = []
    for order in orders:
        orders_data.append({
            'id': order.id,
            'order_id': order.id,
            'restaurant': order.restaurant.name,
            'restaurant_name': order.restaurant.name,
            'total_price': str(order.total_price),
            'delivery_fee': str(order.delivery_fee),
            'distance_km': float(order.distance_km) if order.distance_km else 0,
            'rider_earning': str(order.rider_earning) if order.rider_earning else '0',
            'status': order.status,
            'delivery_address': order.delivery_address,
            'created_at': order.created_at,
            'picked_up_at': order.picked_up_at,
            'delivered_at': order.delivered_at
        })
    
    return Response({
        'count': orders.count(),
        'orders': orders_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_status(request, order_id):
    """Get complete order details with buyer, seller, and items information"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    from buyer.models import Order, OrderItem
    
    try:
        order = Order.objects.get(id=order_id, rider=rider)
    except Order.DoesNotExist:
        return Response(
            {'message': 'Order not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get buyer information
    buyer_info = {
        'name': 'Guest',
        'phone': '',
        'email': ''
    }
    if order.buyer and order.buyer.user:
        first_name = order.buyer.user.first_name or ''
        last_name = order.buyer.user.last_name or ''
        buyer_info['name'] = f"{first_name} {last_name}".strip() or order.buyer.user.username
        buyer_info['phone'] = order.buyer.phone or ''
        buyer_info['email'] = order.buyer.user.email or ''
    
    # Get restaurant/seller information
    restaurant_info = {
        'name': order.restaurant.name,
        'address': order.restaurant.address or '',
        'latitude': str(order.restaurant.latitude) if order.restaurant.latitude else '',
        'longitude': str(order.restaurant.longitude) if order.restaurant.longitude else '',
        'image': order.restaurant.image.url if order.restaurant.image else None,
    }
    
    # Get order items
    order_items = []
    try:
        items = OrderItem.objects.filter(order=order)
        for item in items:
            order_items.append({
                'id': item.id,
                'name': item.menu_item.name,
                'quantity': item.quantity,
                'price': str(item.price),
                'subtotal': str(float(item.price) * item.quantity),
            })
    except Exception as e:
        # If items fail to fetch, continue without them
        print(f"Error fetching order items: {e}")
    
    return Response({
        'id': order.id,
        'order_id': order.id,
        'status': order.status,
        'delivery_address': order.delivery_address,
        'delivery_latitude': order.delivery_latitude,
        'delivery_longitude': order.delivery_longitude,
        'total_price': str(order.total_price),
        'delivery_fee': str(order.delivery_fee),
        'distance_km': float(order.distance_km) if order.distance_km else 0,
        'rider_earning': str(order.rider_earning) if order.rider_earning else '0',
        'platform_commission': str(order.platform_commission) if order.platform_commission else '0',
        'payment_method': order.payment_method,
        'created_at': order.created_at.isoformat() if order.created_at else None,
        'picked_up_at': order.picked_up_at.isoformat() if order.picked_up_at else None,
        'delivered_at': order.delivered_at.isoformat() if order.delivered_at else None,
        'confirmation_code': order.confirmation_code,
        # Buyer information
        'buyer': buyer_info,
        # Restaurant/Seller information
        'restaurant': restaurant_info,
        # Order items
        'items': order_items,
        'items_count': len(order_items),
    }, status=status.HTTP_200_OK)


# ==================== WALLET ====================

class WalletView(APIView):
    """Get rider wallet information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get wallet balance and info"""
        try:
            rider = RiderProfile.objects.get(user=request.user)
        except RiderProfile.DoesNotExist:
            return Response(
                {'message': 'Rider profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            wallet = rider.wallet
        except RiderWallet.DoesNotExist:
            return Response(
                {'message': 'Wallet not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'balance': str(wallet.available_balance),
            'pending_balance': str(wallet.pending_balance),
            'total_earned': str(wallet.total_earned),
            'total_withdrawn': str(wallet.total_withdrawn),
            'last_payout_date': wallet.last_payout_date
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_transactions(request):
    """Get wallet transactions"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    transactions = rider.transactions.all().order_by('-created_at')
    
    trans_data = []
    for transaction in transactions:
        trans_data.append({
            'id': transaction.id,
            'amount': str(transaction.amount),
            'transaction_type': transaction.transaction_type,
            'status': transaction.status,
            'order_id': transaction.order_id,
            'created_at': transaction.created_at
        })
    
    return Response({
        'count': transactions.count(),
        'transactions': trans_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_funds(request):
    """Request fund withdrawal"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        wallet = rider.wallet
    except RiderWallet.DoesNotExist:
        return Response(
            {'message': 'Wallet not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    amount = request.data.get('amount')
    
    if not amount:
        return Response(
            {'message': 'Amount is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return Response(
            {'message': 'Invalid amount.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if amount <= 0:
        return Response(
            {'message': 'Amount must be greater than 0.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if amount > wallet.available_balance:
        return Response(
            {'message': 'Insufficient balance.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create withdrawal transaction
    transaction = RiderTransaction.objects.create(
        rider=rider,
        amount=amount,
        transaction_type='withdrawal',
        status='pending'
    )
    
    return Response({
        'message': 'Withdrawal request submitted.',
        'transaction_id': transaction.id,
        'amount': str(amount),
        'status': 'pending'
    }, status=status.HTTP_200_OK)


# ==================== HELPER FUNCTIONS ====================

def can_go_online(rider):
    """Check if rider can go online"""
    # Phase 6: Check suspension/deactivation status
    if rider.account_status in ['suspended', 'deactivated']:
        return False
    
    # ✅ MVP AUTO-APPROVAL: If all 3 user steps are complete, auto-approve
    all_user_steps_complete = (
        rider.phone_verified and
        rider.documents.filter(status='approved').exists() and
        hasattr(rider, 'bank_details') and
        rider.bank_details is not None and
        rider.profile_completion_percent == 100
    )
    
    if all_user_steps_complete and rider.account_status != 'approved':
        # Auto-approve for MVP testing
        rider.account_status = 'approved'
        rider.is_verified = True
        rider.verification_status = 'approved'
        rider.save()
        return True
    
    return (
        rider.phone_verified and
        rider.documents.filter(status='approved').exists() and
        hasattr(rider, 'bank_details') and
        rider.bank_details is not None and
        rider.profile_completion_percent == 100 and
        rider.account_status == 'approved' and
        rider.is_verified and
        rider.verification_status == 'approved'
    )


def get_blocked_reasons(rider):
    """Get reasons why rider cannot go online"""
    reasons = []
    
    # Phase 6: Check suspension/deactivation first
    if rider.account_status == 'suspended':
        if rider.suspension_start_date:
            days_remaining = 7 - (timezone.now() - rider.suspension_start_date).days
            reasons.append(f'Account suspended - auto-reactivates in {max(0, days_remaining)} days')
        else:
            reasons.append('Account suspended due to low ratings')
        return reasons
    
    if rider.account_status == 'deactivated':
        reasons.append('Account permanently deactivated - contact admin')
        return reasons
    
    if not rider.phone_verified:
        reasons.append('Phone number not verified')
    
    if not rider.documents.filter(status='approved').exists():
        reasons.append('Documents not approved')
    
    if not hasattr(rider, 'bank_details') or rider.bank_details is None:
        reasons.append('Bank details not added')
    
    if rider.profile_completion_percent < 100:
        reasons.append(f'Profile incomplete ({rider.profile_completion_percent}%)')
    
    if rider.account_status != 'approved':
        reasons.append(f'Account status: {rider.account_status}')
    
    if rider.verification_status != 'approved':
        reasons.append('Verification pending')
    
    return reasons


# ==================== DELIVERY FEE ESTIMATION ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def estimate_delivery_fee(request):
    """
    Estimate delivery fee based on distance
    
    Request body:
    {
        "restaurant_id": 1,
        "buyer_lat": 6.5244,
        "buyer_lon": 3.3792
    }
    
    Returns:
    {
        "distance_km": 5.5,
        "delivery_fee": 650,
        "rider_earning": 390,
        "platform_commission": 260
    }
    """
    try:
        from seller.models import Restaurant
        from rider.assignment_service import calculate_distance, calculate_delivery_fee, calculate_rider_earning
        
        restaurant_id = request.data.get('restaurant_id')
        buyer_lat = request.data.get('buyer_lat')
        buyer_lon = request.data.get('buyer_lon')
        
        if not all([restaurant_id, buyer_lat, buyer_lon]):
            return Response(
                {'error': 'Missing required fields: restaurant_id, buyer_lat, buyer_lon'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get restaurant location
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response(
                {'error': 'Restaurant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not restaurant.latitude or not restaurant.longitude:
            return Response(
                {'error': 'Restaurant location not available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate distance
        distance = calculate_distance(
            buyer_lat, buyer_lon,
            float(restaurant.latitude), float(restaurant.longitude)
        )
        
        # Calculate fees
        delivery_fee = calculate_delivery_fee(distance)
        rider_earning = calculate_rider_earning(delivery_fee)
        platform_commission = delivery_fee - rider_earning
        
        return Response({
            'distance_km': round(float(distance), 2),
            'delivery_fee': int(delivery_fee),
            'rider_earning': int(rider_earning),
            'platform_commission': int(platform_commission)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== SERVICE AREAS ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_available_service_areas(request):
    """Get list of all available service areas/zones"""
    try:
        areas = [
            {'code': 'lekki', 'name': 'Lekki', 'icon': '📍'},
            {'code': 'ikoyi', 'name': 'Ikoyi', 'icon': '📍'},
            {'code': 'vi', 'name': 'Victoria Island', 'icon': '📍'},
            {'code': 'yaba', 'name': 'Yaba', 'icon': '📍'},
            {'code': 'ikeja', 'name': 'Ikeja', 'icon': '📍'},
            {'code': 'surulere', 'name': 'Surulere', 'icon': '📍'},
            {'code': 'mushin', 'name': 'Mushin', 'icon': '📍'},
            {'code': 'apapa', 'name': 'Apapa', 'icon': '📍'},
            {'code': 'bariga', 'name': 'Bariga', 'icon': '📍'},
            {'code': 'mainland', 'name': 'Mainland', 'icon': '📍'},
        ]
        return Response(areas, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rider_service_areas(request):
    """Get rider's currently selected service areas"""
    try:
        rider = request.user.rider_profile
        service_areas = RiderServiceArea.objects.filter(rider=rider, is_selected=True)
        data = [
            {
                'id': area.id,
                'area_code': area.area_code,
                'area_name': area.area_name,
                'added_at': area.added_at,
            }
            for area in service_areas
        ]
        return Response(data, status=status.HTTP_200_OK)
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_rider_service_areas(request):
    """Set/update rider's service areas"""
    try:
        rider = request.user.rider_profile
        selected_areas = request.data.get('service_areas', [])  # List of area codes
        
        if not selected_areas:
            return Response(
                {'error': 'At least one service area must be selected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map of area codes to names
        area_names = {
            'lekki': 'Lekki',
            'ikoyi': 'Ikoyi',
            'vi': 'Victoria Island',
            'yaba': 'Yaba',
            'ikeja': 'Ikeja',
            'surulere': 'Surulere',
            'mushin': 'Mushin',
            'apapa': 'Apapa',
            'bariga': 'Bariga',
            'mainland': 'Mainland',
        }
        
        # Clear existing service areas
        RiderServiceArea.objects.filter(rider=rider).delete()
        
        # Add selected service areas
        created_areas = []
        for area_code in selected_areas:
            if area_code in area_names:
                area = RiderServiceArea.objects.create(
                    rider=rider,
                    area_code=area_code,
                    area_name=area_names[area_code],
                    is_selected=True
                )
                created_areas.append({
                    'id': area.id,
                    'area_code': area.area_code,
                    'area_name': area.area_name,
                })
        
        return Response({
            'message': f'Selected {len(created_areas)} service area(s)',
            'service_areas': created_areas
        }, status=status.HTTP_201_CREATED)
    
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

