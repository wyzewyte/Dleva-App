"""
Location History Service
Manages GPS tracking for buyers during delivery orders
Handles location storage, validation, and cleanup
"""

from decimal import Decimal
from django.utils import timezone
from django.db.models import Q
from .models import LocationHistory, Order
import logging
import math

logger = logging.getLogger(__name__)


class LocationHistoryService:
    """Service for tracking and managing buyer GPS locations"""
    
    # GPS accuracy threshold - ignore if accuracy > 100m
    MAX_ACCURACY_THRESHOLD = 100
    
    # Minimum distance change to record new location (meters)
    MIN_DISTANCE_DELTA = 10
    
    @staticmethod
    def save_location(buyer_profile, latitude, longitude, accuracy, order_id=None):
        """
        Save buyer's GPS location
        
        Args:
            buyer_profile: BuyerProfile instance
            latitude: GPS latitude (Decimal or float)
            longitude: GPS longitude (Decimal or float)
            accuracy: GPS accuracy in meters (float)
            order_id: Optional active order ID
        
        Returns:
            LocationHistory instance or None if validation fails
        """
        try:
            # Convert to Decimal for database storage
            latitude = Decimal(str(latitude))
            longitude = Decimal(str(longitude))
            
            # Validate coordinates
            if not LocationHistoryService._validate_coordinates(latitude, longitude):
                logger.warning(f"Invalid coordinates for buyer {buyer_profile.id}: {latitude}, {longitude}")
                return None
            
            # Validate accuracy
            if accuracy > LocationHistoryService.MAX_ACCURACY_THRESHOLD:
                logger.debug(f"Accuracy too low for buyer {buyer_profile.id}: {accuracy}m > {LocationHistoryService.MAX_ACCURACY_THRESHOLD}m")
                return None
            
            # Check if location actually changed significantly
            last_location = LocationHistory.objects.filter(buyer=buyer_profile).latest('recorded_at')
            distance = LocationHistoryService._calculate_distance(
                float(last_location.latitude), float(last_location.longitude),
                float(latitude), float(longitude)
            )
            
            # If distance < 10m, skip to save database space
            if distance < LocationHistoryService.MIN_DISTANCE_DELTA:
                logger.debug(f"Location unchanged for buyer {buyer_profile.id}: {distance}m moved")
                return None
                
        except LocationHistory.DoesNotExist:
            # First location, always save
            pass
        except Exception as e:
            logger.error(f"Error checking last location: {str(e)}")
        
        try:
            # Get active order if not specified
            if not order_id:
                active_order = Order.objects.filter(
                    buyer=buyer_profile,
                    status__in=['assigned', 'arrived_at_pickup', 'picked_up']
                ).latest('created_at')
                order = active_order
            else:
                order = Order.objects.get(id=order_id, buyer=buyer_profile)
            
            is_tracking = order.status in ['assigned', 'arrived_at_pickup', 'picked_up']
            
        except Order.DoesNotExist:
            order = None
            is_tracking = False
        except Exception as e:
            logger.error(f"Error finding active order: {str(e)}")
            order = None
            is_tracking = False
        
        # Create location history record
        location = LocationHistory.objects.create(
            buyer=buyer_profile,
            order=order,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            is_live_tracking=is_tracking
        )
        
        logger.info(f"Location saved for buyer {buyer_profile.id}: ({latitude}, {longitude}) accuracy={accuracy}m")
        return location
    
    @staticmethod
    def get_buyer_live_location(buyer_profile, order_id=None):
        """
        Get buyer's most recent location
        
        Args:
            buyer_profile: BuyerProfile instance
            order_id: Optional order ID to filter
        
        Returns:
            LocationHistory instance or None
        """
        try:
            query = LocationHistory.objects.filter(buyer=buyer_profile)
            
            if order_id:
                query = query.filter(order_id=order_id)
            
            location = query.latest('recorded_at')
            return location
        except LocationHistory.DoesNotExist:
            return None
    
    @staticmethod
    def get_location_trail(buyer_profile, order_id, limit=20):
        """
        Get location trail for visualization
        
        Args:
            buyer_profile: BuyerProfile instance
            order_id: Order ID
            limit: Number of recent locations to return
        
        Returns:
            QuerySet of LocationHistory objects
        """
        return LocationHistory.objects.filter(
            buyer=buyer_profile,
            order_id=order_id
        ).order_by('-recorded_at')[:limit]
    
    @staticmethod
    def start_tracking(order):
        """Mark order as live tracking enabled"""
        try:
            LocationHistory.objects.filter(
                order=order
            ).update(is_live_tracking=True)
            logger.info(f"Live tracking started for order {order.id}")
        except Exception as e:
            logger.error(f"Error starting tracking: {str(e)}")
    
    @staticmethod
    def stop_tracking(order):
        """Mark order as no longer tracking"""
        try:
            LocationHistory.objects.filter(
                order=order
            ).update(is_live_tracking=False)
            logger.info(f"Live tracking stopped for order {order.id}")
        except Exception as e:
            logger.error(f"Error stopping tracking: {str(e)}")
    
    @staticmethod
    def cleanup_old_locations(days=30):
        """
        Delete location history older than specified days (optional cleanup)
        
        Args:
            days: Number of days to retain
        """
        try:
            cutoff_date = timezone.now() - timezone.timedelta(days=days)
            deleted_count, _ = LocationHistory.objects.filter(
                recorded_at__lt=cutoff_date
            ).delete()
            logger.info(f"Cleanup: Deleted {deleted_count} location records older than {days} days")
            return deleted_count
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            return 0
    
    @staticmethod
    def _validate_coordinates(latitude, longitude):
        """Validate GPS coordinates are within valid ranges"""
        try:
            lat = float(latitude)
            lon = float(longitude)
            return -90 <= lat <= 90 and -180 <= lon <= 180
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def _calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two points using Haversine formula
        Returns distance in meters
        """
        try:
            R = 6371000  # Earth's radius in meters
            
            lat1_rad = math.radians(lat1)
            lat2_rad = math.radians(lat2)
            delta_lat = math.radians(lat2 - lat1)
            delta_lon = math.radians(lon2 - lon1)
            
            a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
            c = 2 * math.asin(math.sqrt(a))
            
            distance = R * c
            return distance
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return 0
