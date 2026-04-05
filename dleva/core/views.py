"""
Phase 2: Location API Endpoints
Clean, dedicated endpoints for all location operations.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .models import Location, LocationHistory
from .location_service import LocationService
from seller.models import Restaurant
from buyer.models import BuyerProfile
from utils.paystack_service import PaystackService


# ==================== GEOCODING ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def list_paystack_banks(request):
    """Shared Paystack bank list endpoint for buyer, seller, and rider flows."""
    result = PaystackService.list_banks()

    if not result.get('success'):
        return Response(
            {'error': result.get('error', 'Unable to fetch banks right now.')},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    banks = [
        {
            'name': bank.get('name'),
            'code': str(bank.get('code')),
        }
        for bank in result.get('banks', [])
        if bank.get('name') and bank.get('code') is not None
    ]

    return Response({'banks': banks})


@api_view(['POST'])
@permission_classes([AllowAny])
def resolve_paystack_account(request):
    """Shared Paystack account resolution endpoint for bank-account verification flows."""
    bank_code = str(request.data.get('bank_code', '')).strip()
    account_number = str(request.data.get('account_number', '')).strip()

    if not bank_code:
        return Response({'bank_code': ['Bank code is required.']}, status=status.HTTP_400_BAD_REQUEST)

    if not account_number:
        return Response({'account_number': ['Account number is required.']}, status=status.HTTP_400_BAD_REQUEST)

    if not account_number.isdigit() or len(account_number) != 10:
        return Response(
            {'account_number': ['Account number must be exactly 10 digits.']},
            status=status.HTTP_400_BAD_REQUEST
        )

    banks_result = PaystackService.list_banks()
    if not banks_result.get('success'):
        return Response(
            {'error': banks_result.get('error', 'Unable to fetch banks right now.')},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    matched_bank = next(
        (bank for bank in banks_result.get('banks', []) if str(bank.get('code')) == bank_code),
        None
    )
    if not matched_bank:
        return Response({'bank_code': ['Invalid bank code.']}, status=status.HTTP_400_BAD_REQUEST)

    resolve_result = PaystackService.resolve_account(account_number, bank_code)
    if not resolve_result.get('success'):
        return Response(
            {'error': resolve_result.get('error', 'Unable to resolve account.')},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({
        'bank_code': bank_code,
        'bank_name': matched_bank.get('name'),
        'account_number': resolve_result.get('account_number', account_number),
        'account_name': resolve_result.get('account_name'),
        'verified': True,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def geocode_address(request):
    """
    Convert address to latitude/longitude.
    
    Request:
    {
        "address": "123 Lekki Road, Lagos, Nigeria"
    }
    
    Response:
    {
        "success": true,
        "latitude": 6.4969,
        "longitude": 3.5745,
        "address": "123 Lekki Road, Lekki, Lagos, Nigeria",
        "city": "Lagos",
        "area": "Lekki"
    }
    """
    try:
        address = request.data.get('address')
        
        if not address:
            return Response(
                {'error': 'Address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = LocationService.geocode_address(address)
        
        if 'error' in result:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'success': True,
            'latitude': float(result['latitude']),
            'longitude': float(result['longitude']),
            'address': result['address'],
            'city': result.get('city'),
            'area': result.get('area'),
        })
    except Exception as e:
        return Response(
            {'error': f'Geocoding failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def reverse_geocode_location(request):
    """
    Convert latitude/longitude to address.
    
    Query Params:
    - latitude: float (required)
    - longitude: float (required)
    
    Response:
    {
        "address": "123 Lekki Road, Lekki, Lagos, Nigeria",
        "city": "Lagos",
        "area": "Lekki"
    }
    """
    try:
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = LocationService.reverse_geocode(latitude, longitude)
            return Response({
                'address': result.get('address'),
                'city': result.get('city'),
                'area': result.get('area'),
            })
        except ValueError as e:
            # Reverse geocoding failed - return error instead of coordinates
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': f'Failed to reverse geocode: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== LOCATION MANAGEMENT ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_user_location(request):
    """
    Save or update user's location.
    
    Request:
    {
        "location_type": "buyer_delivery",  // buyer_delivery, buyer_home, rider_current
        "address": "123 Lekki Road, Lagos",
        "latitude": 6.4969,
        "longitude": 3.5745,
        "city": "Lagos",  // optional
        "area": "Lekki"   // optional
    }
    
    Response:
    {
        "success": true,
        "location": {
            "id": 1,
            "address": "123 Lekki Road, Lagos",
            "latitude": 6.4969,
            "longitude": 3.5745,
            "city": "Lagos",
            "area": "Lekki"
        },
        "validation": {
            "status": "clean",
            "reason": "Valid location change"
        }
    }
    """
    try:
        location_type = request.data.get('location_type')
        address = request.data.get('address')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        city = request.data.get('city')
        area = request.data.get('area')
        
        # Validate required fields
        if not all([location_type, address, latitude, longitude]):
            return Response(
                {'error': 'location_type, address, latitude, and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = LocationService.save_user_location(
            request.user, location_type, address, latitude, longitude, city, area
        )
        
        if not result['success']:
            return Response(
                {'error': result.get('error')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        location = result['location']
        return Response({
            'success': True,
            'location': {
                'id': location.id,
                'address': location.address,
                'latitude': float(location.latitude),
                'longitude': float(location.longitude),
                'city': location.city,
                'area': location.area,
            },
            'validation': result['validation']
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to save location: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user_location(request):
    """
    Get user's current location.
    
    Query Params:
    - location_type: buyer_delivery, buyer_home, or rider_current (optional)
    
    Response:
    {
        "location": {
            "id": 1,
            "address": "123 Lekki Road, Lagos",
            "latitude": 6.4969,
            "longitude": 3.5745,
            "city": "Lagos",
            "area": "Lekki"
        }
    }
    """
    try:
        location_type = request.query_params.get('location_type')
        
        # Get user's profile
        try:
            if location_type and location_type.startswith('buyer'):
                profile = BuyerProfile.objects.get(user=request.user)
            else:
                from rider.models import RiderProfile
                profile = RiderProfile.objects.get(user=request.user)
        except (BuyerProfile.DoesNotExist, RiderProfile.DoesNotExist):
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not profile.current_location:
            return Response(
                {'error': 'Location not set'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        location = profile.current_location
        return Response({
            'location': {
                'id': location.id,
                'address': location.address,
                'latitude': float(location.latitude),
                'longitude': float(location.longitude),
                'city': location.city,
                'area': location.area,
            }
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to get location: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_location_history(request):
    """
    Get user's location history.
    
    Query Params:
    - location_type: filter by type (optional)
    - limit: max records (default 10)
    
    Response:
    {
        "count": 3,
        "locations": [
            {
                "location": {...},
                "location_type": "buyer_delivery",
                "validation_status": "clean",
                "created_at": "2026-03-01T10:30:00Z"
            },
            ...
        ]
    }
    """
    try:
        location_type = request.query_params.get('location_type')
        limit = int(request.query_params.get('limit', 10))
        
        history = LocationService.get_location_history(
            request.user, location_type, limit
        )
        
        results = []
        for record in history:
            results.append({
                'location': {
                    'id': record.location.id,
                    'address': record.location.address,
                    'latitude': float(record.location.latitude),
                    'longitude': float(record.location.longitude),
                    'city': record.location.city,
                    'area': record.location.area,
                },
                'location_type': record.location_type,
                'validation_status': record.validation_status,
                'validation_reason': record.validation_reason,
                'created_at': record.created_at.isoformat(),
            })
        
        return Response({
            'count': len(results),
            'locations': results
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to get history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_locations(request):
    """
    Get recent saved locations for quick access (dropdown).
    
    Query Params:
    - location_type: buyer_delivery, buyer_home, rider_current (required)
    - limit: max results (default 5)
    
    Response:
    {
        "count": 3,
        "locations": [
            {
                "id": 1,
                "address": "123 Lekki Road, Lagos",
                "latitude": 6.4969,
                "longitude": 3.5745,
                "city": "Lagos",
                "area": "Lekki"
            },
            ...
        ]
    }
    """
    try:
        location_type = request.query_params.get('location_type')
        limit = int(request.query_params.get('limit', 5))
        
        if not location_type:
            return Response(
                {'error': 'location_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        locations = LocationService.get_recent_locations(
            request.user, location_type, limit
        )
        
        return Response({
            'count': len(locations),
            'locations': locations
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to get recent locations: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== DELIVERY FEE ESTIMATION ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def estimate_delivery_fee(request):
    """
    Estimate delivery fee between two locations.
    
    Request:
    {
        "pickup_location_id": 1,      // or provide coordinates
        "delivery_location_id": 2,    // or provide coordinates
        "pickup_latitude": 6.4969,    // alternative to location_id
        "pickup_longitude": 3.5745,
        "delivery_latitude": 6.5,
        "delivery_longitude": 3.6
    }
    
    Response:
    {
        "distance_km": 5.2,
        "base_fee": 500.00,
        "distance_fee": 260.00,
        "total_fee": 760.00,
        "rider_earning": 646.00,
        "platform_commission": 114.00
    }
    """
    try:
        # Get pickup location
        pickup_location_id = request.data.get('pickup_location_id')
        if pickup_location_id:
            pickup_location = Location.objects.get(id=pickup_location_id)
        else:
            pickup_lat = request.data.get('pickup_latitude')
            pickup_lon = request.data.get('pickup_longitude')
            if not pickup_lat or not pickup_lon:
                return Response(
                    {'error': 'Pickup location is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            pickup_location = Location(
                address='Pickup Location',
                latitude=pickup_lat,
                longitude=pickup_lon
            )
        
        # Get delivery location
        delivery_location_id = request.data.get('delivery_location_id')
        if delivery_location_id:
            delivery_location = Location.objects.get(id=delivery_location_id)
        else:
            delivery_lat = request.data.get('delivery_latitude')
            delivery_lon = request.data.get('delivery_longitude')
            if not delivery_lat or not delivery_lon:
                return Response(
                    {'error': 'Delivery location is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            delivery_location = Location(
                address='Delivery Location',
                latitude=delivery_lat,
                longitude=delivery_lon
            )
        
        # Calculate fee
        fee_data = LocationService.estimate_delivery_fee(pickup_location, delivery_location)
        
        if 'error' in fee_data:
            return Response(
                {'error': fee_data['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'distance_km': float(fee_data['distance_km']),
            'base_fee': float(fee_data['base_fee']),
            'distance_fee': float(fee_data['distance_fee']),
            'total_fee': float(fee_data['total_fee']),
            'rider_earning': float(fee_data['rider_earning']),
            'platform_commission': float(fee_data['platform_commission']),
        })
    except Location.DoesNotExist:
        return Response(
            {'error': 'Location not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Fee estimation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== RESTAURANT FILTERING BY LOCATION ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_nearby_restaurants(request):
    """
    Get restaurants near a location.
    
    Query Params:
    - latitude: float (required)
    - longitude: float (required)
    - radius: int in km (default 15)
    - search: search query (optional)
    - limit: max results (default 20)
    - offset: pagination (default 0)
    
    Response:
    {
        "total_count": 45,
        "radius": 15,
        "restaurants": [
            {
                "id": 1,
                "name": "Pizza Place",
                "distance_km": 2.5,
                "delivery_fee": 775.00,
                "delivery_time": "30-45 mins",
                "image": "...",
                "rating": 4.5
            },
            ...
        ]
    }
    """
    try:
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        radius = int(request.query_params.get('radius', 15))
        search = request.query_params.get('search')
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create buyer location
        buyer_location = Location(
            address='Buyer Location',
            latitude=latitude,
            longitude=longitude
        )
        
        # Get nearby restaurants
        result = LocationService.get_nearby_restaurants(
            buyer_location, radius, limit, offset, search
        )
        
        if 'error' in result:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(result)
    except Exception as e:
        return Response(
            {'error': f'Restaurant search failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
