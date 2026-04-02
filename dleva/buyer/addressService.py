"""
Address Service
Manages address operations with intelligent caching
Combines Mapbox API with local cache to reduce external API calls
"""

import logging
from typing import Optional, List, Dict, Tuple
from decimal import Decimal
from django.utils import timezone
from .models import AddressCache
from .mapboxGeocoder import MapboxGeocoder

logger = logging.getLogger(__name__)


class AddressService:
    """
    High-level service for address operations with caching
    """
    
    # Cache validity period (24 hours)
    CACHE_VALIDITY_HOURS = 24
    
    @staticmethod
    def search_addresses(query: str, use_cache: bool = True) -> List[Dict]:
        """
        Search for addresses with intelligent caching
        
        Args:
            query: Address search query
            use_cache: Whether to use cached results
        
        Returns:
            List of address results
        """
        if not query or len(query.strip()) < 3:
            return []
        
        try:
            # Generate cache key
            cache_key = AddressCache.get_cache_key(query)
            
            # Try to get from cache
            if use_cache:
                cached = AddressService._get_from_cache(cache_key)
                if cached:
                    logger.info(f"✅ Address cache hit for: {query}")
                    return [cached]
            
            # Query Mapbox
            logger.info(f"🌐 Querying Mapbox for: {query}")
            results = MapboxGeocoder.search_address(query, limit=5)
            
            if results:
                # Cache the primary result
                primary_result = results[0]
                AddressService._save_to_cache(
                    cache_key,
                    query,
                    primary_result,
                    cache_type='search'
                )
            
            return results
        
        except Exception as e:
            logger.error(f"Error searching addresses: {str(e)}")
            return []
    
    @staticmethod
    def reverse_geocode(latitude: float, longitude: float, use_cache: bool = True) -> Optional[Dict]:
        """
        Get address from coordinates with caching
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
            use_cache: Whether to use cached results
        
        Returns:
            Address details or None
        """
        try:
            # Generate cache key based on coordinates (rounded to ~100m accuracy)
            cache_key = AddressService._get_coordinate_cache_key(latitude, longitude)
            
            # Try to get from cache
            if use_cache:
                cached = AddressService._get_from_cache(cache_key)
                if cached:
                    logger.info(f"✅ Reverse geocode cache hit for: {latitude}, {longitude}")
                    return cached
            
            # Query Mapbox
            logger.info(f"🌐 Reverse geocoding: {latitude}, {longitude}")
            result = MapboxGeocoder.reverse_geocode(latitude, longitude)
            
            if result:
                # Cache the result
                query_text = result.get('display_name', '')
                AddressService._save_to_cache(
                    cache_key,
                    query_text,
                    result,
                    cache_type='reverse'
                )
            
            return result
        
        except Exception as e:
            logger.error(f"Error in reverse geocoding: {str(e)}")
            return None
    
    @staticmethod
    def validate_address(address: str) -> Tuple[bool, Optional[Dict]]:
        """
        Validate address and get coordinates
        
        Args:
            address: Address to validate
        
        Returns:
            Tuple of (is_valid, address_details)
        """
        try:
            is_valid, details = MapboxGeocoder.validate_address(address)
            
            if is_valid and details:
                # Cache validated address
                cache_key = AddressCache.get_cache_key(address)
                AddressService._save_to_cache(
                    cache_key,
                    address,
                    details,
                    cache_type='validated'
                )
            
            return is_valid, details
        
        except Exception as e:
            logger.error(f"Error validating address: {str(e)}")
            return False, None
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Tuple[float, float]]:
        """
        Convert address to coordinates
        
        Args:
            address: Address string
        
        Returns:
            Tuple of (latitude, longitude) or None
        """
        try:
            results = AddressService.search_addresses(address)
            if results:
                result = results[0]
                return (result['latitude'], result['longitude'])
            return None
        except Exception as e:
            logger.error(f"Error geocoding address: {str(e)}")
            return None
    
    @staticmethod
    def _get_from_cache(cache_key: str) -> Optional[Dict]:
        """Retrieve cached address"""
        try:
            cached = AddressCache.objects.filter(query_hash=cache_key).first()
            if cached:
                cached.increment_access()
                return {
                    'display_name': cached.display_name,
                    'latitude': float(cached.latitude),
                    'longitude': float(cached.longitude),
                    'address_type': cached.address_type,
                    'importance': cached.importance,
                    'address': cached.raw_data.get('address', {}),
                    'cached': True,
                }
            return None
        except Exception as e:
            logger.error(f"Cache retrieval error: {str(e)}")
            return None
    
    @staticmethod
    def _save_to_cache(cache_key: str, query_text: str, result: Dict, cache_type: str = 'search'):
        """Save address to cache"""
        try:
            AddressCache.objects.update_or_create(
                query_hash=cache_key,
                defaults={
                    'query_text': query_text,
                    'display_name': result.get('display_name', ''),
                    'latitude': Decimal(str(result.get('latitude', 0))),
                    'longitude': Decimal(str(result.get('longitude', 0))),
                    'cache_type': cache_type,
                    'address_type': result.get('address_type', 'unknown'),
                    'importance': float(result.get('importance', 0)),
                    'raw_data': result,
                }
            )
            logger.debug(f"Cached address: {query_text}")
        except Exception as e:
            logger.error(f"Cache save error: {str(e)}")
    
    @staticmethod
    def _get_coordinate_cache_key(latitude: float, longitude: float) -> str:
        """
        Generate cache key for coordinates
        Rounds to ~100m accuracy to cache similar locations
        """
        import hashlib
        # Round to 4 decimal places (~11m accuracy)
        rounded_lat = round(float(latitude), 4)
        rounded_lon = round(float(longitude), 4)
        query = f"rev_{rounded_lat}_{rounded_lon}"
        return hashlib.sha256(query.encode()).hexdigest()
    
    @staticmethod
    def cleanup_old_cache(days: int = 30):
        """
        Delete cache entries older than N days (optional cleanup)
        Can be called via management command or periodic task
        
        Args:
            days: Age threshold for deletion
        """
        try:
            cutoff_date = timezone.now() - timezone.timedelta(days=days)
            # Only delete entries that haven't been accessed recently
            deleted_count, _ = AddressCache.objects.filter(
                last_accessed__lt=cutoff_date,
                access_count__lt=2
            ).delete()
            logger.info(f"Cleaned up {deleted_count} old cache entries")
            return deleted_count
        except Exception as e:
            logger.error(f"Cache cleanup error: {str(e)}")
            return 0
