"""
Nominatim Geocoding Service
Provides address validation, geocoding, and reverse geocoding
using OpenStreetMap's free Nominatim API
"""

import requests
import logging
from decimal import Decimal
from typing import Optional, List, Dict, Tuple
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


class NominatimGeocoder:
    """
    Wrapper around Nominatim API for address/coordinate operations
    Free tier: ~1 request per second, no API key needed
    """
    
    BASE_URL = "https://nominatim.openstreetmap.org"
    USER_AGENT = "DLeva-Delivery-App/1.0"
    TIMEOUT = 10
    
    @staticmethod
    def search_address(query: str, country: str = "NG", limit: int = 5) -> List[Dict]:
        """
        Search for addresses using free-text query
        
        Args:
            query: Address or place name to search
            country: Country code (default: Nigeria)
            limit: Maximum results to return
        
        Returns:
            List of matching addresses with coordinates
        """
        try:
            if not query or len(query.strip()) < 3:
                return []
            
            params = {
                'q': query,
                'countrycodes': country,
                'format': 'json',
                'limit': limit,
                'addressdetails': 1,
            }
            
            response = requests.get(
                f"{NominatimGeocoder.BASE_URL}/search",
                params=params,
                headers={'User-Agent': NominatimGeocoder.USER_AGENT},
                timeout=NominatimGeocoder.TIMEOUT
            )
            
            if response.status_code != 200:
                logger.warning(f"Nominatim search failed: {response.status_code}")
                return []
            
            results = response.json()
            
            # Format results for frontend
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'display_name': result.get('display_name', ''),
                    'latitude': float(result.get('lat', 0)),
                    'longitude': float(result.get('lon', 0)),
                    'address_type': result.get('type', 'unknown'),
                    'importance': float(result.get('importance', 0)),
                    'address': result.get('address', {}),
                })
            
            logger.info(f"Found {len(formatted_results)} addresses for: {query}")
            return formatted_results
        
        except requests.RequestException as e:
            logger.error(f"Nominatim request error: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error in search_address: {str(e)}")
            return []
    
    @staticmethod
    def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict]:
        """
        Convert coordinates to address (reverse geocoding)
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
        
        Returns:
            Address details or None if failed
        """
        try:
            # Validate coordinates
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                logger.warning(f"Invalid coordinates: {latitude}, {longitude}")
                return None
            
            params = {
                'lat': latitude,
                'lon': longitude,
                'format': 'json',
                'addressdetails': 1,
                'zoom': 18,
            }
            
            response = requests.get(
                f"{NominatimGeocoder.BASE_URL}/reverse",
                params=params,
                headers={'User-Agent': NominatimGeocoder.USER_AGENT},
                timeout=NominatimGeocoder.TIMEOUT
            )
            
            if response.status_code != 200:
                logger.warning(f"Reverse geocoding failed: {response.status_code}")
                return None
            
            result = response.json()
            
            # Check if result has address
            if 'address' not in result:
                logger.warning(f"No address found for: {latitude}, {longitude}")
                return None
            
            formatted_result = {
                'display_name': result.get('display_name', ''),
                'latitude': float(result.get('lat', latitude)),
                'longitude': float(result.get('lon', longitude)),
                'address': result.get('address', {}),
                'address_type': result.get('type', 'unknown'),
            }
            
            # Extract key address components
            addr = result.get('address', {})
            formatted_result['street'] = addr.get('road', addr.get('amenity', ''))
            formatted_result['city'] = addr.get('city', addr.get('town', addr.get('village', '')))
            formatted_result['state'] = addr.get('state', '')
            formatted_result['postcode'] = addr.get('postcode', '')
            formatted_result['country'] = addr.get('country', '')
            
            logger.info(f"Reverse geocoded: {formatted_result['display_name']}")
            return formatted_result
        
        except requests.RequestException as e:
            logger.error(f"Reverse geocoding request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error in reverse_geocode: {str(e)}")
            return None
    
    @staticmethod
    def validate_address(address: str) -> Tuple[bool, Optional[Dict]]:
        """
        Validate if address is real and routable
        
        Args:
            address: Address string to validate
        
        Returns:
            Tuple of (is_valid, address_details)
        """
        try:
            results = NominatimGeocoder.search_address(address, limit=1)
            
            if not results:
                return False, None
            
            # Get the most relevant result
            best_match = results[0]
            
            # Validate it's a real place (importance > 0)
            if best_match['importance'] <= 0:
                logger.info(f"Address has low importance score: {address}")
                return False, best_match
            
            # Check if it's in Nigeria (Lagos, Abuja, etc.)
            addr_details = best_match.get('address', {})
            country = addr_details.get('country', '').lower()
            
            # Accept if in Nigeria or has valid coordinates
            is_valid = 'nigeria' in country or 'naija' in country
            
            logger.info(f"Address validation: {address} -> {is_valid}")
            return is_valid, best_match
        
        except Exception as e:
            logger.error(f"Error validating address: {str(e)}")
            return False, None
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Tuple[float, float]]:
        """
        Convert address to coordinates (geocoding)
        
        Args:
            address: Address string
        
        Returns:
            Tuple of (latitude, longitude) or None if failed
        """
        try:
            results = NominatimGeocoder.search_address(address, limit=1)
            
            if not results:
                return None
            
            best_match = results[0]
            return (best_match['latitude'], best_match['longitude'])
        
        except Exception as e:
            logger.error(f"Error geocoding address: {str(e)}")
            return None
    
    @staticmethod
    def format_address_components(address_dict: Dict) -> str:
        """
        Format address components into readable string
        
        Args:
            address_dict: Address dictionary from Nominatim
        
        Returns:
            Formatted address string
        """
        try:
            parts = []
            
            for key in ['road', 'house_number', 'neighbourhood', 'suburb', 
                       'city', 'town', 'village', 'county', 'state', 'postcode']:
                value = address_dict.get(key)
                if value:
                    parts.append(str(value))
            
            return ', '.join(parts) if parts else address_dict.get('display_name', 'Unknown')
        except:
            return 'Unknown'
