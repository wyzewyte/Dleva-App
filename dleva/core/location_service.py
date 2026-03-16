"""
Phase 2: Backend Location Service Layer
Single source of truth for all location operations, distance calculations, and fee logic.
"""

from decimal import Decimal
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import requests
from .models import Location, LocationHistory, LocationValidator
from seller.models import Restaurant
from buyer.models import BuyerProfile
from rider.models import RiderProfile


class LocationService:
    """
    Centralized location service for all location-related operations.
    Handles: location updates, distance calculations, fee estimation, restaurant filtering.
    """
    
    # Nominatim API (free, OpenStreetMap)
    GEOCODE_API_URL = "https://nominatim.openstreetmap.org/search"
    REVERSE_GEOCODE_API_URL = "https://nominatim.openstreetmap.org/reverse"
    
    # Fee calculation constants
    BASE_DELIVERY_FEE = Decimal('500.00')  # Base fee in NGN
    COST_PER_KM = Decimal('50.00')  # NGN per km
    
    # Timeout for API calls (seconds)
    API_TIMEOUT = 5
    
    @staticmethod
    def geocode_address(address):
        """
        Convert address to latitude/longitude using Nominatim API.
        
        Args:
            address (str): Human-readable address
            
        Returns:
            dict: {
                'latitude': Decimal,
                'longitude': Decimal,
                'address': str (formatted),
                'city': str,
                'area': str,
                'error': str (if failed)
            }
        """
        if not address:
            return {'error': 'Address cannot be empty'}
        
        try:
            response = requests.get(
                LocationService.GEOCODE_API_URL,
                params={
                    'q': address,
                    'format': 'json',
                    'limit': 1,
                    'addressdetails': 1
                },
                timeout=LocationService.API_TIMEOUT,
            )
            response.raise_for_status()
            
            results = response.json()
            if not results:
                return {'error': 'Address not found'}
            
            result = results[0]
            address_parts = result.get('address', {})
            
            return {
                'latitude': Decimal(result['lat']),
                'longitude': Decimal(result['lon']),
                'address': result.get('display_name', address),
                'city': address_parts.get('city') or address_parts.get('town'),
                'area': address_parts.get('suburb') or address_parts.get('village'),
            }
        except requests.exceptions.Timeout:
            return {'error': 'Geocoding service timeout. Please try again.'}
        except requests.exceptions.RequestException as e:
            return {'error': f'Geocoding failed: {str(e)}'}
        except (ValueError, KeyError) as e:
            return {'error': f'Invalid response from geocoding service: {str(e)}'}
    
    @staticmethod
    def reverse_geocode(latitude, longitude):
        """
        Convert latitude/longitude to address using Nominatim API.
        
        Args:
            latitude (Decimal or float): Latitude
            longitude (Decimal or float): Longitude
            
        Returns:
            dict: {
                'address': str,
                'city': str,
                'area': str,
                'error': str (if failed)
            }
            
        Raises:
            ValueError: If reverse geocoding fails, to prevent storing coordinates as address
        """
        try:
            response = requests.get(
                LocationService.REVERSE_GEOCODE_API_URL,
                params={
                    'lat': float(latitude),
                    'lon': float(longitude),
                    'format': 'json',
                    'addressdetails': 1
                },
                timeout=LocationService.API_TIMEOUT,
            )
            response.raise_for_status()
            
            result = response.json()
            address_parts = result.get('address', {})
            display_name = result.get('display_name', '')
            
            # Ensure we have a valid address, not coordinates
            if not display_name or display_name.strip() == '':
                raise ValueError('No address found for these coordinates')
            
            return {
                'address': display_name,
                'city': address_parts.get('city') or address_parts.get('town'),
                'area': address_parts.get('suburb') or address_parts.get('village'),
            }
        except requests.exceptions.Timeout:
            raise ValueError('Reverse geocoding service timed out. Please enter address manually.')
        except requests.exceptions.RequestException as e:
            raise ValueError(f'Reverse geocoding service unavailable: {str(e)}. Please enter address manually.')
    
    @staticmethod
    def create_or_update_location(address, latitude, longitude, city=None, area=None):
        """
        Create a new Location or return existing one if same coordinates.
        
        Args:
            address (str): Human-readable address
            latitude (Decimal): Latitude
            longitude (Decimal): Longitude
            city (str): City name (optional)
            area (str): Area/suburb name (optional)
            
        Returns:
            Location: The location object
        """
        # Validate coordinates
        is_valid, error = LocationValidator.validate_coordinates(latitude, longitude)
        if not is_valid:
            raise ValueError(error)
        
        # Check if location already exists (within 10m tolerance)
        existing = Location.objects.filter(
            latitude__gte=Decimal(latitude) - Decimal('0.0001'),
            latitude__lte=Decimal(latitude) + Decimal('0.0001'),
            longitude__gte=Decimal(longitude) - Decimal('0.0001'),
            longitude__lte=Decimal(longitude) + Decimal('0.0001'),
        ).first()
        
        if existing:
            return existing
        
        # Create new location
        location = Location.objects.create(
            address=address,
            latitude=Decimal(str(latitude)),
            longitude=Decimal(str(longitude)),
            city=city,
            area=area
        )
        return location
    
    @staticmethod
    def save_user_location(user, location_type, address, latitude, longitude, city=None, area=None):
        """
        Save a location for a user (buyer, rider, or seller) with history tracking.
        
        Args:
            user: Django User instance
            location_type (str): 'rider_current', 'buyer_delivery', 'buyer_home', 'seller_restaurant'
            address (str): Human-readable address
            latitude (Decimal): Latitude
            longitude (Decimal): Longitude
            city (str): City name (optional)
            area (str): Area name (optional)
            
        Returns:
            dict: {
                'success': bool,
                'location': Location instance,
                'validation': {'status': 'clean'/'suspicious'/'blocked', 'reason': str},
                'error': str (if failed)
            }
        """
        try:
            # Create/get location
            location = LocationService.create_or_update_location(
                address, latitude, longitude, city, area
            )
            
            # Get user's profile
            profile = None
            if location_type.startswith('buyer'):
                profile = BuyerProfile.objects.get(user=user)
            elif location_type == 'rider_current':
                profile = RiderProfile.objects.get(user=user)
            
            # Get previous location for validation
            previous_location = None
            time_since_previous = None
            distance_from_previous = None
            
            if hasattr(profile, 'current_location') and profile.current_location:
                previous_location = profile.current_location
                
                # Calculate distance and time
                distance_from_previous = previous_location.distance_to(location)
                
                # Get last location history to calculate time
                last_history = LocationHistory.objects.filter(
                    user=user,
                    location_type=location_type
                ).latest('created_at')
                
                if last_history:
                    time_delta = timezone.now() - last_history.created_at
                    time_since_previous = int(time_delta.total_seconds())
            
            # Validate location change
            is_valid, validation_status, validation_reason = LocationValidator.validate_location_change(
                user, location_type, location, previous_location, time_since_previous
            )
            
            # Update user's profile with both the location relationship AND individual address/coordinate fields
            if profile:
                profile.current_location = location
                # Explicitly set address and coordinates on the profile
                profile.address = address
                profile.latitude = latitude
                profile.longitude = longitude
                profile.save()
            
            # Record in history
            LocationHistory.objects.create(
                user=user,
                location_type=location_type,
                location=location,
                previous_location=previous_location,
                distance_from_previous=distance_from_previous,
                time_since_previous_minutes=int(time_since_previous / 60) if time_since_previous else None,
                is_validated=is_valid,
                validation_status=validation_status,
                validation_reason=validation_reason
            )
            
            return {
                'success': True,
                'location': location,
                'validation': {
                    'status': validation_status,
                    'reason': validation_reason
                }
            }
        except BuyerProfile.DoesNotExist:
            return {'error': 'Buyer profile not found', 'success': False}
        except RiderProfile.DoesNotExist:
            return {'error': 'Rider profile not found', 'success': False}
        except ValueError as e:
            return {'error': str(e), 'success': False}
        except Exception as e:
            return {'error': f'Failed to save location: {str(e)}', 'success': False}
    
    @staticmethod
    def estimate_delivery_fee(pickup_location, delivery_location):
        """
        Calculate delivery fee based on distance.
        
        Args:
            pickup_location (Location): Restaurant location
            delivery_location (Location): Buyer delivery location
            
        Returns:
            dict: {
                'distance_km': Decimal,
                'base_fee': Decimal,
                'distance_fee': Decimal,
                'total_fee': Decimal,
                'rider_earning': Decimal (85% of total),
                'platform_commission': Decimal (15% of total)
            }
        """
        try:
            distance_km = pickup_location.distance_to(delivery_location)
            
            # Calculate fees
            distance_fee = Decimal(str(distance_km)) * LocationService.COST_PER_KM
            total_fee = LocationService.BASE_DELIVERY_FEE + distance_fee
            
            # Split earnings: 85% to rider, 15% to platform
            rider_earning = total_fee * Decimal('0.85')
            platform_commission = total_fee * Decimal('0.15')
            
            return {
                'distance_km': Decimal(str(distance_km)),
                'base_fee': LocationService.BASE_DELIVERY_FEE,
                'distance_fee': distance_fee,
                'total_fee': total_fee,
                'rider_earning': rider_earning.quantize(Decimal('0.01')),
                'platform_commission': platform_commission.quantize(Decimal('0.01'))
            }
        except Exception as e:
            return {'error': f'Fee calculation failed: {str(e)}'}
    
    @staticmethod
    def get_nearby_restaurants(buyer_location, radius_km=15, limit=20, offset=0, search_query=None):
        """
        Get restaurants near a buyer's location, sorted by distance.
        
        Args:
            buyer_location (Location): Buyer's current location
            radius_km (int): Search radius in kilometers (default 15)
            limit (int): Max results to return
            offset (int): Pagination offset
            search_query (str): Optional search query
            
        Returns:
            dict: {
                'total_count': int,
                'radius': int,
                'restaurants': [
                    {
                        'id': int,
                        'name': str,
                        'distance_km': Decimal,
                        'delivery_fee': Decimal,
                        'delivery_time': str,
                        ...
                    }
                ]
            }
        """
        try:
            restaurants = Restaurant.objects.filter(is_active=True)
            
            # Filter by search query
            if search_query:
                restaurants = restaurants.filter(
                    Q(name__icontains=search_query) |
                    Q(description__icontains=search_query) |
                    Q(category__icontains=search_query)
                )
            
            # Filter by radius and calculate distances
            nearby = []
            for restaurant in restaurants:
                if not restaurant.latitude or not restaurant.longitude:
                    continue  # Skip restaurants without location
                
                restaurant_location = Location.objects.filter(
                    latitude=restaurant.latitude,
                    longitude=restaurant.longitude
                ).first()
                
                if not restaurant_location:
                    # Create temporary location for calculation
                    restaurant_location = Location(
                        address=restaurant.address,
                        latitude=restaurant.latitude,
                        longitude=restaurant.longitude
                    )
                
                distance = buyer_location.distance_to(restaurant_location)
                
                if distance <= radius_km:
                    nearby.append({
                        'restaurant': restaurant,
                        'location': restaurant_location,
                        'distance_km': distance
                    })
            
            # Sort by distance
            nearby.sort(key=lambda x: x['distance_km'])
            
            # Paginate
            total_count = len(nearby)
            paginated = nearby[offset:offset + limit]
            
            # Format response
            results = []
            for item in paginated:
                restaurant = item['restaurant']
                distance = item['distance_km']
                
                # Calculate delivery fee for this distance
                fee_data = LocationService.estimate_delivery_fee(
                    item['location'], buyer_location
                )
                
                results.append({
                    'id': restaurant.id,
                    'name': restaurant.name,
                    'description': restaurant.description,
                    'category': restaurant.category,
                    'distance_km': round(distance, 2),
                    'delivery_fee': float(fee_data.get('total_fee', 0)),
                    'delivery_time': restaurant.delivery_time,
                    'image': restaurant.image.url if restaurant.image else None,
                    'rating': 4.5,  # TODO: Integrate with rating system
                })
            
            return {
                'total_count': total_count,
                'radius': radius_km,
                'restaurants': results,
                'limit': limit,
                'offset': offset
            }
        except Exception as e:
            return {'error': f'Restaurant search failed: {str(e)}'}
    
    @staticmethod
    def get_location_history(user, location_type=None, limit=10):
        """
        Get location history for a user.
        
        Args:
            user: Django User instance
            location_type (str): Filter by location type (optional)
            limit (int): Number of recent records
            
        Returns:
            QuerySet of LocationHistory ordered by most recent
        """
        query = LocationHistory.objects.filter(user=user)
        
        if location_type:
            query = query.filter(location_type=location_type)
        
        return query.order_by('-created_at')[:limit]
    
    @staticmethod
    def get_recent_locations(user, location_type, limit=5):
        """
        Get distinct recent locations (for location dropdown).
        
        Args:
            user: Django User instance
            location_type (str): Type of locations to retrieve
            limit (int): Max locations to return
            
        Returns:
            list: Recent unique locations
        """
        history = LocationHistory.objects.filter(
            user=user,
            location_type=location_type
        ).order_by('-created_at').values('location_id', 'location__address').distinct()[:limit]
        
        locations = []
        for record in history:
            location = Location.objects.get(id=record['location_id'])
            locations.append({
                'id': location.id,
                'address': location.address,
                'city': location.city,
                'area': location.area,
                'latitude': float(location.latitude),
                'longitude': float(location.longitude),
            })
        
        return locations
