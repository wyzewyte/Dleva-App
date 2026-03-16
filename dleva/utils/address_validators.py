"""
Address Validation Utilities
Ensures proper separation of address text from coordinates
"""
import re
from decimal import Decimal


def is_coordinate_string(address):
    """
    Check if an address string looks like coordinates (lat,long format).
    Prevents storing GPS coordinates as address text.
    
    Examples that return True:
    - "6.5244, 3.3792"
    - "6.5244,3.3792"
    - "-23.1234, 45.6789"
    
    Examples that return False:
    - "123 Main Street, City, State"
    - "no 7, igun road, ekpoma, edo state"
    - "Level 3, 456 Building, Downtown"
    
    Args:
        address (str): Address string to validate
        
    Returns:
        bool: True if address looks like coordinates, False otherwise
    """
    if not isinstance(address, str) or not address.strip():
        return False
    
    # Pattern: optional minus, 1-2 digits, dot, 4+ decimal digits, comma, same pattern
    # Matches: "6.5244, 3.3792" or "-23.1234,45.6789"
    coordinate_pattern = r'^\s*-?\d{1,2}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\s*$'
    
    return bool(re.match(coordinate_pattern, address.strip()))


def validate_address_coordinate_separation(address, latitude, longitude):
    """
    Validate that address contains actual text and coordinates are in proper fields.
    
    Args:
        address (str): Address text
        latitude (float/Decimal): Latitude coordinate
        longitude (float/Decimal): Longitude coordinate
        
    Returns:
        dict: {
            'valid': bool,
            'errors': list of error messages,
            'warnings': list of warning messages
        }
        
    Raises:
        ValueError: If validation fails with specific error details
    """
    errors = []
    warnings = []
    
    # Check if address is coordinate-like
    if address and is_coordinate_string(address):
        errors.append(
            f"Address appears to contain coordinates instead of street address. "
            f"Address: '{address}'. Please provide a full street address."
        )
    
    # Check if address is missing but coordinates exist
    if not address or not str(address).strip():
        if latitude and longitude:
            errors.append(
                f"Address is required. Cannot use coordinates ({latitude}, {longitude}) "
                f"as address. Please provide a street address."
            )
    
    # Validate coordinate ranges
    if latitude is not None:
        try:
            lat_float = float(latitude)
            if lat_float < -90 or lat_float > 90:
                errors.append(f"Latitude {latitude} is out of valid range (-90 to 90)")
        except (ValueError, TypeError):
            errors.append(f"Invalid latitude format: {latitude}")
    
    if longitude is not None:
        try:
            lon_float = float(longitude)
            if lon_float < -180 or lon_float > 180:
                errors.append(f"Longitude {longitude} is out of valid range (-180 to 180)")
        except (ValueError, TypeError):
            errors.append(f"Invalid longitude format: {longitude}")
    
    # Validate both coordinates are present if either is provided
    if (latitude is not None and longitude is None) or (latitude is None and longitude is not None):
        errors.append("Both latitude and longitude must be provided together, or neither")
    
    if errors:
        raise ValueError("; ".join(errors))
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings
    }


def sanitize_address(address):
    """
    Clean and normalize address string.
    
    Args:
        address (str): Raw address string
        
    Returns:
        str: Sanitized address
    """
    if not address:
        return ""
    
    # Remove extra whitespace
    sanitized = " ".join(address.strip().split())
    
    return sanitized


def format_coordinates_for_display(latitude, longitude, precision=4):
    """
    Format coordinates for human-readable display (NOT for storage as address).
    
    Args:
        latitude (float/Decimal): Latitude value
        longitude (float/Decimal): Longitude value
        precision (int): Decimal places for rounding
        
    Returns:
        str: Formatted string like "6.5244, 3.3792"
    """
    lat_str = f"{float(latitude):.{precision}f}"
    lon_str = f"{float(longitude):.{precision}f}"
    return f"{lat_str}, {lon_str}"
