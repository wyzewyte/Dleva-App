"""
Mapbox Geocoding Service
Provides address validation, geocoding, and reverse geocoding
using Mapbox API
"""

import requests
import logging
from decimal import Decimal
from typing import Optional, List, Dict, Tuple
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

logger = logging.getLogger(__name__)


class MapboxGeocoder:
    """
    Wrapper around Mapbox API for address/coordinate operations
    Requires MAPBOX_API_KEY in settings
    """
    
    BASE_URL = "https://api.mapbox.com/geocoding/v5"
    TIMEOUT = 10
    
    @staticmethod
    def _get_api_key():
        """Get Mapbox API key from settings"""
        api_key = getattr(settings, 'MAPBOX_API_KEY', None)
        if not api_key:
            logger.error("MAPBOX_API_KEY not configured in settings")
            return None
        return api_key
    
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
        api_key = MapboxGeocoder._get_api_key()
        if not api_key:
            return []
        
        try:
            if not query or len(query.strip()) < 3:
                return []
            
            # Mapbox uses country parameter with ISO 3166 alpha 2 code
            params = {
                'access_token': api_key,
                'limit': limit,
                'country': country.lower(),
                'types': 'place,address,neighborhood,region',
            }
            
            # URL encode the query in the endpoint
            url = f"{MapboxGeocoder.BASE_URL}/mapbox.places/{query}.json"
            
            response = requests.get(
                url,
                params=params,
                timeout=MapboxGeocoder.TIMEOUT
            )
            
            if response.status_code != 200:
                logger.warning(f"Mapbox search failed: {response.status_code}")
                return []
            
            results = response.json()
            
            # Check for errors
            if results.get('message'):
                logger.warning(f"Mapbox error: {results.get('message')}")
                return []
            
            features = results.get('features', [])
            
            # Format results for frontend
            formatted_results = []
            for feature in features:
                geometry = feature.get('geometry', {})
                properties = feature.get('properties', {})
                
                # Coordinates are [longitude, latitude] in GeoJSON
                coords = geometry.get('coordinates', [0, 0])
                
                # Get full address from place_name (includes street, city, state, country)
                place_name = feature.get('place_name', '')
                
                # Parse context to extract individual components
                context = feature.get('context', [])
                address_dict = {}
                
                for ctx in context:
                    ctx_id = ctx.get('id', '')
                    ctx_type = ctx_id.split('.')[0] if '.' in ctx_id else ctx_id
                    if ctx_type == 'place':
                        address_dict['city'] = ctx.get('text', '')
                    elif ctx_type == 'region':
                        address_dict['state'] = ctx.get('text', '')
                    elif ctx_type == 'country':
                        address_dict['country'] = ctx.get('text', '')
                    elif ctx_type == 'postcode':
                        address_dict['postcode'] = ctx.get('text', '')
                
                # Build a descriptive address string prioritizing the full place_name
                display_address = place_name or feature.get('text', '')
                
                formatted_results.append({
                    'display_name': display_address,  # Full formatted address from Mapbox
                    'address': display_address,       # Full address for fallback display
                    'latitude': float(coords[1]) if len(coords) > 1 else 0,
                    'longitude': float(coords[0]),
                    'address_type': feature.get('type', 'unknown'),
                    'city': address_dict.get('city', ''),
                    'state': address_dict.get('state', ''),
                    'postcode': address_dict.get('postcode', ''),
                    'country': address_dict.get('country', ''),
                    'area': address_dict.get('city', ''),
                })
                
                logger.debug(f"Formatted result - display: {display_address}, city: {address_dict.get('city', '')})")
            
            logger.info(f"Found {len(formatted_results)} addresses for: {query}")
            return formatted_results
        
        except requests.RequestException as e:
            logger.error(f"Mapbox request error: {str(e)}")
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
        api_key = MapboxGeocoder._get_api_key()
        if not api_key:
            return None
        
        try:
            # Validate coordinates
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                logger.warning(f"Invalid coordinates: {latitude}, {longitude}")
                return None
            
            # Mapbox reverse geocoding endpoint: /coordinates.json
            # Coordinates format: [longitude, latitude]
            params = {
                'access_token': api_key,
                'limit': 1,
                'types': 'place,address,neighborhood,region',
            }
            
            url = f"{MapboxGeocoder.BASE_URL}/mapbox.places/{longitude},{latitude}.json"
            
            response = requests.get(
                url,
                params=params,
                timeout=MapboxGeocoder.TIMEOUT
            )
            
            if response.status_code != 200:
                logger.warning(f"Reverse geocoding failed: {response.status_code}")
                return None
            
            result = response.json()
            
            # Check for errors
            if result.get('message'):
                logger.warning(f"Mapbox error: {result.get('message')}")
                return None
            
            features = result.get('features', [])
            
            if not features:
                logger.warning(f"No address found for: {latitude}, {longitude}")
                return None
            
            feature = features[0]
            geometry = feature.get('geometry', {})
            coords = geometry.get('coordinates', [0, 0])
            
            # Build context hierarchy
            context = feature.get('context', [])
            address_dict = {}
            
            for ctx in context:
                ctx_type = ctx.get('id', '').split('.')[0]
                if ctx_type == 'place':
                    address_dict['city'] = ctx.get('text', '')
                elif ctx_type == 'region':
                    address_dict['state'] = ctx.get('text', '')
                elif ctx_type == 'country':
                    address_dict['country'] = ctx.get('text', '')
                elif ctx_type == 'postcode':
                    address_dict['postcode'] = ctx.get('text', '')
            
            formatted_result = {
                'display_name': feature.get('place_name', ''),
                'latitude': float(coords[1]) if len(coords) > 1 else latitude,
                'longitude': float(coords[0]) if len(coords) > 0 else longitude,
                'address': address_dict,
                'address_type': feature.get('type', 'unknown'),
            }
            
            # Extract key address components
            formatted_result['street'] = feature.get('text', '')
            formatted_result['city'] = address_dict.get('city', '')
            formatted_result['state'] = address_dict.get('state', '')
            formatted_result['postcode'] = address_dict.get('postcode', '')
            formatted_result['country'] = address_dict.get('country', '')
            
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
            results = MapboxGeocoder.search_address(address, limit=1)
            
            if not results:
                return False, None
            
            # Get the most relevant result
            best_match = results[0]
            
            # Validate it's a real place (relevance > 0.1)
            if best_match['importance'] <= 0.1:
                logger.info(f"Address has low relevance score: {address}")
                return False, best_match
            
            # Check if it's in Nigeria
            display_name = best_match.get('display_name', '').lower()
            
            # Accept if in Nigeria
            is_valid = 'nigeria' in display_name or 'ng' in display_name
            
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
            results = MapboxGeocoder.search_address(address, limit=1)
            
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
            address_dict: Address dictionary from Mapbox
        
        Returns:
            Formatted address string
        """
        try:
            parts = []
            
            for key in ['street', 'neighborhood', 'city', 'state', 'postcode', 'country']:
                value = address_dict.get(key)
                if value:
                    parts.append(str(value))
            
            return ', '.join(parts) if parts else address_dict.get('display_name', 'Unknown')
        except:
            return 'Unknown'
