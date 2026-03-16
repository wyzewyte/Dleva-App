# Phase 2: Location Endpoints - Quick Reference

## Endpoint Summary

### Publicly Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/geocode/` | POST | Address → Coordinates |
| `/api/reverse-geocode/` | GET | Coordinates → Address |
| `/api/estimate-delivery-fee/` | POST | Calculate delivery fee |
| `/api/restaurants/` | GET | Get restaurants by location |

### Authenticated Endpoints (IsAuthenticated)

| Endpoint | Method | Purpose | User Type |
|----------|--------|---------|-----------|
| `/api/location/save/` | POST | Save user location | Buyer/Rider |
| `/api/location/current/` | GET | Get current location | Buyer/Rider |
| `/api/location/history/` | GET | Get location history | Buyer/Rider |
| `/api/location/recent/` | GET | Get recent locations | Buyer/Rider |

---

## Quick Examples

### 1. Geocode Address
```bash
curl -X POST http://127.0.0.1:8000/api/geocode/ \
  -H "Content-Type: application/json" \
  -d '{"address":"123 Lekki Road, Lagos, Nigeria"}'

# Response
{
  "success": true,
  "latitude": 6.4969,
  "longitude": 3.5745,
  "address": "123 Lekki Road, Lekki, Lagos, Nigeria",
  "city": "Lagos",
  "area": "Lekki"
}
```

### 2. Reverse Geocode
```bash
curl http://127.0.0.1:8000/api/reverse-geocode/?latitude=6.4969&longitude=3.5745

# Response
{
  "address": "123 Lekki Road, Lekki, Lagos, Nigeria",
  "city": "Lagos",
  "area": "Lekki"
}
```

### 3. Save Location (Authenticated)
```bash
curl -X POST http://127.0.0.1:8000/api/location/save/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "location_type": "buyer_delivery",
    "address": "123 Lekki Road, Lagos",
    "latitude": 6.4969,
    "longitude": 3.5745,
    "city": "Lagos",
    "area": "Lekki"
  }'

# Response
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
```

### 4. Get Nearby Restaurants
```bash
curl "http://127.0.0.1:8000/api/restaurants/?latitude=6.4969&longitude=3.5745&radius=15&limit=10"

# Response
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
    }
  ]
}
```

### 5. Estimate Delivery Fee
```bash
curl -X POST http://127.0.0.1:8000/api/estimate-delivery-fee/ \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_latitude": 6.4969,
    "pickup_longitude": 3.5745,
    "delivery_latitude": 6.5,
    "delivery_longitude": 3.6
  }'

# Response
{
  "distance_km": 5.2,
  "base_fee": 500.00,
  "distance_fee": 260.00,
  "total_fee": 760.00,
  "rider_earning": 646.00,
  "platform_commission": 114.00
}
```

### 6. Get Location History (Authenticated)
```bash
curl http://127.0.0.1:8000/api/location/history/?location_type=buyer_delivery&limit=5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response
{
  "count": 3,
  "locations": [
    {
      "location": {
        "id": 1,
        "address": "123 Lekki Road, Lagos",
        "latitude": 6.4969,
        "longitude": 3.5745,
        "city": "Lagos",
        "area": "Lekki"
      },
      "location_type": "buyer_delivery",
      "validation_status": "clean",
      "validation_reason": "Valid location change",
      "created_at": "2026-03-01T10:30:00Z"
    }
  ]
}
```

### 7. Get Recent Locations (Dropdown) (Authenticated)
```bash
curl http://127.0.0.1:8000/api/location/recent/?location_type=buyer_delivery&limit=5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response
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
    }
  ]
}
```

---

## Fee Calculation Formula

```
distance_km = Haversine distance between pickup and delivery

base_fee = ₦500
distance_fee = distance_km × ₦50
total_fee = base_fee + distance_fee

rider_earning = total_fee × 0.85  (85%)
platform_commission = total_fee × 0.15  (15%)

Example: 5.2 km
- base_fee: ₦500
- distance_fee: 5.2 × ₦50 = ₦260
- total_fee: ₦500 + ₦260 = ₦760
- rider_earning: ₦760 × 0.85 = ₦646
- platform_commission: ₦760 × 0.15 = ₦114
```

---

## Frontend Service Methods

All methods in `src/services/location.js`:

```javascript
// Public methods (no auth required)
geocodeAddress(address)
reverseGeocodeLocation(latitude, longitude)
estimateDeliveryFee(params)
getNearbyRestaurants(latitude, longitude, options)

// Authenticated methods
saveUserLocation({ locationType, address, latitude, longitude, city, area })
getCurrentUserLocation(locationType)
getLocationHistory(locationType, limit)
getRecentLocations(locationType, limit)
```

### Usage Example
```javascript
import { 
  geocodeAddress, 
  getNearbyRestaurants, 
  saveUserLocation 
} from '@/services/location';

// Geocode
const coords = await geocodeAddress('123 Lekki Road, Lagos');
// { latitude: 6.4969, longitude: 3.5745, ... }

// Get nearby restaurants
const restaurants = await getNearbyRestaurants(6.4969, 3.5745, {
  radius: 15,
  search: 'pizza',
  limit: 20
});

// Save location (authenticated)
const result = await saveUserLocation({
  locationType: 'buyer_delivery',
  address: '123 Lekki Road, Lagos',
  latitude: 6.4969,
  longitude: 3.5745
});
```

---

## Location Types

```
buyer_delivery    - Address for current order delivery
buyer_home        - Saved home address
rider_current     - Rider's current location during delivery
```

---

## Keys from Environment Variables

```json
{
  "NOMINATIM_API": "https://nominatim.openstreetmap.org/",
  "GEOCODE_TIMEOUT": "5 seconds",
  "DEFAULT_RADIUS": "15 km",
  "MAX_RESTAURANTS_PER_PAGE": "20",
  "BASE_DELIVERY_FEE": "₦500",
  "PER_KM_CHARGE": "₦50/km"
}
```

---

## Error Codes

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Address is required | Provide address in request |
| 400 | Latitude and longitude are required | Provide coordinates |
| 401 | Unauthorized | Add Bearer token to Authorization header |
| 404 | Location not found | Check location ID or create location first |
| 500 | Geocoding failed | Check address format, Nominatim API may be down |

---

## Database Schema

### Location Table
```sql
CREATE TABLE core_location (
  id INTEGER PRIMARY KEY,
  address VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(10, 8),
  city VARCHAR(100),
  area VARCHAR(100),
  created_at TIMESTAMP
);
```

### LocationHistory Table
```sql
CREATE TABLE core_locationhistory (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  location_id INTEGER,
  location_type VARCHAR(50),
  validation_status VARCHAR(20),
  validation_reason TEXT,
  time_since_previous INTERVAL,
  distance_from_previous DECIMAL(10, 2),
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth_user (id),
  FOREIGN KEY (location_id) REFERENCES core_location (id)
);
```

---

## Status & Next Steps

✅ **COMPLETED**
- All 8 endpoints implemented
- Frontend service methods
- API configuration
- Error handling
- Database validation (0 issues)

⏳ **NEXT (Phase 3)**
- Frontend location selector component
- Buyer checkout integration
- Rider location tracking UI
- Map display (optional)

---

**Version**: 1.0  
**Phase**: 2 Complete  
**Ready for**: Phase 3 (Frontend Location Selector)
