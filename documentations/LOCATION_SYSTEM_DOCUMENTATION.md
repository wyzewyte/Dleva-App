# Django Backend Location System - Complete Documentation

## Overview
The Dleva platform uses a centralized location management system with geocoding, GPS tracking, delivery fee estimation, and fraud detection. There are **NO pre-defined hostels/areas/zones** - locations are created dynamically as users interact with the system.

---

## 1. LOCATION DATA STRUCTURE

### Core Location Model (`core/models.py`)
```python
class Location(models.Model):
    # Address & Coordinates
    address: CharField(500)              # "123 Lekki Road, Lagos"
    latitude: DecimalField(10, 8)        # 6.5244 (±1.1mm precision)
    longitude: DecimalField(10, 8)       # 3.3792 (±1.1mm precision)
    
    # Metadata (for reference/filtering)
    city: CharField(100, nullable)       # "Lagos"
    area: CharField(100, nullable)       # "Lekki", "Victoria Island", etc.
    
    # Timestamps
    created_at: DateTimeField
    updated_at: DateTimeField
```

**Key Fields:** 8-decimal precision allows ~1.1mm accuracy (excellent for delivery tracking)

**Indexes:**
- `(latitude, longitude)` - for distance queries
- `(city, area)` - for location filtering

---

## 2. LOCATION HISTORY & TRACKING

### LocationHistory Model (`core/models.py`)
Tracks all location changes for analytics and fraud detection:

```python
class LocationHistory(models.Model):
    LOCATION_TYPES = [
        'rider_current',        # Real-time rider GPS
        'buyer_delivery',       # Where buyer wants delivery
        'buyer_home',          # Buyer's saved home address
        'seller_restaurant',   # Restaurant location
    ]
    
    user: ForeignKey(User)
    location_type: CharField(choices=LOCATION_TYPES)
    location: ForeignKey(Location)
    previous_location: ForeignKey(Location, nullable)  # For change validation
    
    # Fraud Detection Fields
    distance_from_previous: DecimalField(6, 2, km)
    time_since_previous_minutes: IntegerField
    is_validated: BooleanField
    validation_status: CharField(choices=['clean', 'suspicious', 'blocked'])
    validation_reason: TextField
    
    created_at: DateTimeField(db_indexed)  # Ordered by this
```

---

## 3. USER PROFILE LOCATION INTEGRATION

### BuyerProfile Location Fields (`buyer/models.py`)
```python
current_location: ForeignKey(Location)           # Currently selected location
latitude: DecimalField(10, 8, nullable)          # Fallback delivery latitude
longitude: DecimalField(10, 8, nullable)         # Fallback delivery longitude
address: TextField(nullable, deprecated)          # Legacy field
```

### RiderProfile Location Fields (`rider/models.py`)
```python
current_location: ForeignKey(Location)           # Real-time current location
current_latitude: DecimalField(10, 8, nullable)  # Current GPS latitude
current_longitude: DecimalField(10, 8, nullable) # Current GPS longitude
location_accuracy: FloatField                    # GPS accuracy in meters
last_location_update: DateTimeField              # Last update timestamp
address: TextField                               # Service area address
```

### SellerProfile/Restaurant Location (`seller/models.py`)
```python
Restaurant.address: CharField(255)
Restaurant.latitude: DecimalField(10, 8, nullable)
Restaurant.longitude: DecimalField(10, 8, nullable)
```

---

## 4. LOCATION SERVICE LAYER (`core/location_service.py`)

### LocationService - Main Operations

#### A. Geocoding (Address → Coordinates)
```
LocationService.geocode_address(address)
Uses: Nominatim API (OpenStreetMap)

Input:  "123 Lekki Road, Lagos, Nigeria"
Output: {
    'latitude': Decimal('6.5244'),
    'longitude': Decimal('3.3792'),
    'address': "123 Lekki Road, Lekki, Lagos, Nigeria",
    'city': "Lagos",
    'area': "Lekki"
}
```

#### B. Reverse Geocoding (Coordinates → Address)
```
LocationService.reverse_geocode(latitude, longitude)
Input:  6.5244, 3.3792
Output: {
    'address': "123 Lekki Road, Lekki, Lagos, Nigeria",
    'city': "Lagos",
    'area': "Lekki"
}
Note: Raises ValueError if no address found (prevents coordinate storage as address)
```

#### C. Create or Update Location
```
LocationService.create_or_update_location(address, latitude, longitude, city, area)
- Creates new Location or returns existing (within 10m tolerance)
- Validates coordinates against service area bounds
- Deduplicates nearby locations
```

#### D. Location History Management
```
LocationService.get_location_history(user, location_type, limit=10)
LocationService.get_recent_locations(user, location_type, limit=5)
- Returns recent locations for dropdowns (quick selection)
```

#### E. Distance Calculation & Delivery Fee
```
Location.distance_to(other_location)  # Returns km

LocationService.estimate_delivery_fee(pickup_location, delivery_location)
Output: {
    'distance_km': 5.2,
    'base_fee': Decimal('500.00'),
    'distance_fee': Decimal('260.00'),
    'total_fee': Decimal('760.00'),
    'rider_earning': Decimal('456.00'),     # 60% of fee
    'platform_commission': Decimal('304.00') # 40% of fee
}

Fee Calculation Rules:
- Distance ≤ 3km   → ₦500 base
- 3-6km           → ₦600 base + ₦100/km extra
- >6km            → ₦1000 base + ₦150/km extra
```

[View calculation in `rider/assignment_service.py`]

---

## 5. LOCATION VALIDATION SYSTEM

### LocationValidator Class (`core/models.py`)

#### Service Area Bounds
```python
VALID_LAT_MIN = 3.0    # Southern boundary (Nigeria)
VALID_LAT_MAX = 14.0   # Northern boundary
VALID_LON_MIN = 2.0    # Western boundary
VALID_LON_MAX = 15.0   # Eastern boundary
```

#### Spoofing Detection Rules (for Riders)
```
Rule 1: Impossible Speed
  If distance > 100km in < 1 minute → BLOCKED
  
Rule 2: Extreme Jump
  If distance > 500km in < 60 minutes → BLOCKED
  
Rule 3: Speed Violation
  Max realistic speed: 200km/h
  If exceeds → Returns 'suspicious' status
  
Buyers: Can change location anywhere (checkout flexibility)
```

---

## 6. API ENDPOINTS

### Core Location Endpoints (`core/urls.py`)

#### A. Geocoding
```
POST /api/geocode/
Body: { "address": "123 Lekki Road, Lagos" }
Response: {
    "success": true,
    "latitude": 6.5244,
    "longitude": 3.3792,
    "address": "123 Lekki Road, Lekki, Lagos, Nigeria",
    "city": "Lagos",
    "area": "Lekki"
}
```

#### B. Reverse Geocoding
```
GET /api/reverse-geocode/?latitude=6.5244&longitude=3.3792
Response: {
    "address": "123 Lekki Road, Lekki, Lagos, Nigeria",
    "city": "Lagos",
    "area": "Lekki"
}
```

#### C. Save User Location
```
POST /api/location/save/
Auth: IsAuthenticated
Body: {
    "location_type": "runner_current",  // buyer_delivery, buyer_home, seller_restaurant
    "address": "123 Lekki Road, Lagos",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "city": "Lagos",
    "area": "Lekki"
}
Response: {
    "success": true,
    "location": {...},
    "validation": {
        "status": "clean",     // clean, suspicious, blocked
        "reason": "Valid location change"
    }
}
```

#### D. Get Current User Location
```
GET /api/location/current/?location_type=buyer_delivery
Auth: IsAuthenticated
Response: {
    "location": {
        "id": 1,
        "address": "123 Lekki Road, Lagos",
        "latitude": 6.5244,
        "longitude": 3.3792,
        "city": "Lagos",
        "area": "Lekki"
    }
}
```

#### E. Get Location History
```
GET /api/location/history/?location_type=buyer_delivery&limit=10
Auth: IsAuthenticated
Response: {
    "count": 3,
    "locations": [
        {
            "location": {...},
            "location_type": "buyer_delivery",
            "validation_status": "clean",
            "validation_reason": "Valid location change",
            "created_at": "2026-03-01T10:30:00Z"
        },
        ...
    ]
}
```

#### F. Get Recent Locations (Quick Access Dropdown)
```
GET /api/location/recent/?location_type=buyer_delivery&limit=5
Auth: IsAuthenticated
Response: {
    "count": 3,
    "locations": [
        {
            "id": 1,
            "address": "123 Lekki Road, Lagos",
            "latitude": 6.5244,
            "longitude": 3.3792,
            "city": "Lagos",
            "area": "Lekki"
        },
        ...
    ]
}
```

#### G. Estimate Delivery Fee
```
POST /api/estimate-delivery-fee/
Body: {
    "pickup_location_id": 1,
    "delivery_location_id": 2
}
OR provide coordinates:
{
    "pickup_latitude": 6.5,
    "pickup_longitude": 3.5,
    "delivery_latitude": 6.6,
    "delivery_longitude": 3.6
}
Response: {
    "distance_km": 5.2,
    "base_fee": 500.00,
    "distance_fee": 260.00,
    "total_fee": 760.00,
    "rider_earning": 456.00,
    "platform_commission": 304.00
}
```

#### H. Get Nearby Restaurants
```
GET /api/restaurants/?latitude=6.5244&longitude=3.3792&radius=15&limit=20&offset=0
Response: {
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
```

---

### Buyer-Specific Location Endpoints (`buyer/urls.py`)

#### A. Save Delivery Location
```
POST /api/buyer/location/
Auth: IsAuthenticated
Body: {
    "address": "123 Lekki Road, Lagos",
    "latitude": 6.5244,
    "longitude": 3.3792
}
Response: {
    "status": "ok",
    "profile": {
        "latitude": 6.5244,
        "longitude": 3.3792,
        "address": "123 Lekki Road, Lagos"
    }
}
```

#### B. GPS Location Update (Live Tracking)
```
POST /api/buyer/gps/location/update/
Auth: IsAuthenticated
Body: {
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 15.5,     // GPS accuracy in meters
    "order_id": 123       // Optional, for association
}
Response: {
    "status": "ok",
    "location": {
        "id": 1,
        "latitude": 6.5244,
        "longitude": 3.3792,
        "accuracy": 15.5,
        "recorded_at": "2026-03-01T10:30:00Z",
        "is_live_tracking": true
    }
}
```

#### C. Get Current GPS Location
```
GET /api/buyer/gps/location/current/
Auth: IsAuthenticated
Response: {
    "location": {...}
}
```

#### D. Address Search (Autocomplete)
```
GET /api/buyer/address/search/?q=lekki
Response: {
    "suggestions": [
        {
            "address": "Lekki Road, Lagos",
            "latitude": 6.5244,
            "longitude": 3.3792
        },
        ...
    ]
}
```

#### E. Reverse Geocode
```
POST /api/buyer/address/reverse-geocode/
Body: {
    "latitude": 6.5244,
    "longitude": 3.3792
}
Response: {
    "address": "123 Lekki Road, Lekki, Lagos, Nigeria"
}
```

#### F. Validate Address
```
POST /api/buyer/address/validate/
Body: {
    "address": "123 Lekki Road, Lagos",
    "latitude": 6.5244,
    "longitude": 3.3792
}
Response: {
    "valid": true,
    "message": "Address and coordinates match within acceptable range"
}
```

---

## 7. LOCATION-RELATED ORDER FIELDS

### Order Model (`buyer/models.py`)

```python
class Order(models.Model):
    # Delivery Location (set at checkout)
    delivery_address: TextField
    delivery_latitude: DecimalField(10, 8)
    delivery_longitude: DecimalField(10, 8)
    
    # Distance & Fees
    distance_km: DecimalField(5, 2)
    delivery_fee: DecimalField(6, 2)
    
    # Rider Assignment (Phase 3)
    rider: ForeignKey(RiderProfile)
    assigned_at: DateTimeField
    
    # Delivery Tracking (Phase 4)
    arrived_at_pickup: DateTimeField
    picked_up_at: DateTimeField
    delivered_at: DateTimeField
```

---

## 8. LOCATION HISTORY SERVICE (`buyer/locationHistoryService.py`)

Manages GPS tracking for buyers during delivery:

```python
class LocationHistoryService:
    MAX_ACCURACY_THRESHOLD = 100      # Ignore if >100m accuracy
    MIN_DISTANCE_DELTA = 10           # Only record if >10m moved
    
    save_location(buyer_profile, latitude, longitude, accuracy, order_id)
    - Validates coordinates
    - Checks GPS accuracy
    - Skips if too close to last location
    - Associates with active order
```

---

## 9. RESTAURANT LOCATION DATA

### Restaurant Selection Logic
1. Frontend sends buyer's current location
2. Backend queries restaurants within radius (default 15km)
3. Calculates distance from buyer to each restaurant
4. Estimates delivery fee based on distance
5. Returns sorted by distance/rating

**Key Fields on Restaurant:**
```python
address: CharField(255)                  # e.g., "123 Lagos Road, Lekki"
latitude: DecimalField(10, 8)           # Restaurant location
longitude: DecimalField(10, 8)
delivery_fee: DecimalField(6, 2)        # Flat delivery fee (or calculated)
delivery_time: CharField                # e.g., "30-45 mins"
```

---

## 10. KEY CONCEPTS

### No Pre-Defined "Zones"
- **Hostels/Areas are NOT hardcoded** - they emerge from location data
- Each location has optional `city` and `area` fields parsed from geocoding
- Areas filter via `Location.objects.filter(area='Lekki')`

### Service Area Coverage
- **North:** 14° latitude
- **South:** 3° latitude  
- **East:** 15° longitude
- **West:** 2° longitude
- Covers most of **Nigeria**

### Distance Calculation
- Uses **Haversine formula** (great-circle distance)
- Returns distance in **kilometers**
- Accurate to ~0.5% for typical delivery distances

### Fraud Detection (Rider Tracking)
- Validates GPS coordinates against service area bounds
- Detects impossible speeds (>6000km/h)
- Marks suspicious locations with status
- Automatically blocks confirmed GPS spoofing

---

## 11. DATA FLOW EXAMPLE: Checkout → Delivery

1. **Buyer selects location** 
   - Searches address → `geocode_address()` → gets lat/lon
   - Or enters GPS coordinates
   - Validates via `LocationValidator.validate_coordinates()`

2. **Restaurant calculation**
   - `get_nearby_restaurants(buyer_lat, buyer_lon, radius=15)`
   - For each restaurant: `restaurant_location.distance_to(order_location)`
   - Calculate fee: `estimate_delivery_fee(restaurant, delivery_location)`

3. **Order creation**
   - Stores `delivery_address`, `delivery_latitude`, `delivery_longitude`, `distance_km`, `delivery_fee`
   - Creates `LocationHistory` entry: `location_type='buyer_delivery'`

4. **Rider assignment**
   - Backend queries nearby rider current locations
   - Calculates distance from rider to restaurant
   - Assigns closest rider
   - Rider's real-time GPS tracked via `GpsLocationUpdateView`

5. **Delivery tracking**
   - Rider posts GPS updates to `gps/location/update/`
   - System validates against fraud rules
   - Frontend shows real-time rider location

---

## 12. IMPORTANT NOTES

### Address-Coordinate Separation Validation
```python
# In checkout and order creation:
validate_address_coordinate_separation(address, latitude, longitude)
- Ensures address and coordinates match
- Prevents fraud where user submits fake address with valid GPS
- Uses Nominatim API to verify
```

### Delivery Fee Calculation (NOT per area/zone)
- **Based on distance**, not predefined zones
- Dynamic calculation from pickup → delivery
- Accounts for: base fee + distance-based fee

### Rider Earnings Split
```
Rider gets: 60% of delivery fee
Platform gets: 40% commission
Minimum rider earning: ₦250
```

### No Username-Based Area Assignment
- Riders/Sellers are NOT limited to specific areas
- Can operate anywhere in service bounds
- Frontend shows all restaurants based on buyer location

---

## 13. TESTING LOCATION ENDPOINTS

### Sample Requests

**Geocode:**
```bash
curl -X POST http://localhost:8000/api/geocode/ \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Lekki Road, Lagos"}'
```

**Estimate Fee:**
```bash
curl -X POST http://localhost:8000/api/estimate-delivery-fee/ \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_latitude": 6.5,
    "pickup_longitude": 3.5,
    "delivery_latitude": 6.6,
    "delivery_longitude": 3.6
  }'
```

**Get Nearby Restaurants:**
```bash
curl http://localhost:8000/api/restaurants/ \
  -G --data-urlencode "latitude=6.5244" \
  --data-urlencode "longitude=3.3792" \
  --data-urlencode "radius=15"
```

---

## Summary Flow

```
User Registration
    ↓
Set Current Location (BuyerProfile.current_location)
    ↓
Search Restaurants (by distance from current_location)
    ↓
Add to Cart
    ↓
Checkout (Validate address ↔ coordinates)
    ↓
Estimate Delivery Fee (distance-based)
    ↓
Payment
    ↓
Order Created (with delivery_latitude, delivery_longitude, distance_km, delivery_fee)
    ↓
Rider Assignment (find closest rider)
    ↓
GPS Tracking (rider posts updates)
    ↓
Delivery Completed
```

All location data is **centralized** in the `Location` model and tracked via `LocationHistory` for analytics and fraud detection.
