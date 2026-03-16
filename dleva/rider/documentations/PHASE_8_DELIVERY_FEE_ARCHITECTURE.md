# Delivery Fee Architecture - Phase 8

## Overview

This document explains the proper, **backend-first architecture** for delivery fee calculations across the Deliva platform.

## Why Backend-First?

### ✅ **Before (Incorrect)**
- Frontend duplicated calculation logic in multiple files (Cart.jsx, Checkout.jsx)
- Frontend calculated fees locally without server validation
- Risk of frontend/backend calculations diverging
- Difficult to maintain + change logic in multiple places

### ✅ **After (Correct)**
- **Single source of truth**: Backend/Django owns all delivery calculations
- **Centralized service**: Frontend service file handles all API calls
- **No duplication**: Logic exists in one place, used everywhere
- **Easy maintenance**: Change logic once, affects all pages automatically
- **Validation**: Backend ensures accuracy

---

## Architecture Components

### 1. Backend API Endpoint

**Location**: `dleva/rider/views.py`

**Endpoint**: `POST /api/rider/estimate-delivery-fee/`

**Purpose**: Calculate delivery fee based on restaurant location and buyer location

**Request Body**:
```json
{
  "restaurant_id": 1,
  "buyer_lat": 6.5244,
  "buyer_lon": 3.3792
}
```

**Response**:
```json
{
  "distance_km": 5.5,
  "delivery_fee": 650,
  "rider_earning": 390,
  "platform_commission": 260
}
```

**Key Features**:
- Calculates distance using Haversine formula (kernel: `assignment_service.py`)
- Applies distance-based fee tiers (same logic as order assignment)
- Returns breakdown: fee, rider earning (60%), platform commission (40%)
- Public endpoint (no authentication required) - for fee estimation before checkout

---

### 2. Frontend Service File

**Location**: `dleva-frontend/src/services/deliveryService.js`

**Purpose**: Centralized delivery fee service for all pages

**Key Exports**:

#### `estimateDeliveryFee(restaurantId, buyerLat, buyerLon)`
- Calls backend API endpoint
- Returns: `{ success, distance, deliveryFee, riderEarning, platformCommission }`
- Used by Cart.jsx and Checkout.jsx

#### `estimateDeliveryFeeWithRetry(restaurantId, buyerLat, buyerLon, maxRetries = 2)`
- Same as above but with retry logic
- Useful for unreliable connections
- Exponential backoff between retries

#### `formatDeliveryFee(fee)`
- Formats fee for consistent display: `₦{amount}`
- Used everywhere fees are displayed

#### `calculateDistance(lat1, lon1, lat2, lon2)`
- Fallback Haversine formula
- Useful for frontend-only scenarios
- **Not used by default** - relies on backend

---

### 3. Updated Frontend Pages

#### Cart.jsx
**What Changed**:
- Removed local `calculateDistance()` and `calculateDeliveryFee()` functions
- Added `loadingFees` state to track which vendors are calculating
- Uses `estimateDeliveryFee()` service to fetch fees from backend
- Displays "Calculating..." while loading
- Shows "Unable to calculate" if API fails

**Flow**:
1. User adds items to cart from multiple vendors
2. Component fetches restaurant details (address, location)
3. For each vendor, calls `estimateDeliveryFee(vendorId, buyerLat, buyerLon)`
4. Displays fee once API responds
5. Fee updates if buyer location changes

---

#### Checkout.jsx
**What Changed**:
- Removed local calculation functions
- Added `loadingDeliveryFee` state
- Uses `estimateDeliveryFee()` service
- Shows "Calculating..." while loading

**Flow**:
1. Page loads with specific vendor (from URL params)
2. Fetches restaurant location
3. Calls `estimateDeliveryFee(vendorId, buyerLat, buyerLon)` 
4. Sets `deliveryFee` state from API response
5. Fee is used for order total calculation

---

### 4. Service File Benefits

Instead of duplicating logic:

```javascript
// ❌ BAD: Duplicated in multiple files
// In Cart.jsx:
const calculateDistance = (lat1, lon1, lat2, lon2) => { ... }

// In Checkout.jsx:
const calculateDistance = (lat1, lon1, lat2, lon2) => { ... }

// In Order List:
const calculateDistance = (lat1, lon1, lat2, lon2) => { ... }
```

Now with service file:
```javascript
// ✅ GOOD: One location, imported everywhere
import { estimateDeliveryFee, formatDeliveryFee } from './services/deliveryService';

// Use it anywhere
const result = await estimateDeliveryFee(restaurantId, lat, lon);
const formatted = formatDeliveryFee(result.deliveryFee);
```

---

## Delivery Fee Calculation Rules

**Distance Tiers** (consistent backend/API):
- ≤ 3 km: ₦500
- 3-6 km: ₦600 + (distance - 3) × ₦100
- > 6 km: ₦1,000 + (distance - 6) × ₦150

**Payment Split** (for fulfillment orders):
- Rider: 60% of delivery_fee
- Platform: 40% of delivery_fee
- Seller: food_cost (total_price - delivery_fee)

---

## API Endpoint Details

### Backend Implementation

**File**: `dleva/rider/views.py` (lines 530-603)

**Function**: `estimate_delivery_fee(request)`

**Why `AllowAny` permission?**
- Frontend needs to estimate fees **before** user is logged in
- Cart/Checkout may be accessed by guest users
- Public estimation doesn't modify any data

**Database Queries**:
1. Fetch restaurant by ID
2. Calculate Haversine distance
3. Return fee breakdown

**Error Handling**:
- Missing parameters → 400 Bad Request
- Restaurant not found → 404 Not Found
- No restaurant location → 400 Bad Request
- Any exception → 500 Internal Server Error

**URL Registration**:
```python
# In dleva/rider/urls.py
path('estimate-delivery-fee/', views.estimate_delivery_fee, name='estimate-delivery-fee'),
```

Full URL: `POST http://127.0.0.1:8000/api/rider/estimate-delivery-fee/`

---

## Testing Checklist

### ✅ Frontend Build
```bash
npm run build  # Should complete without errors
```

### ✅ Backend Endpoint
```bash
# Test with curl or Postman
POST /api/rider/estimate-delivery-fee/
Content-Type: application/json

{
  "restaurant_id": 1,
  "buyer_lat": 6.5244,
  "buyer_lon": 3.3792
}
```

Expected response:
```json
{
  "distance_km": 36.86,
  "delivery_fee": 5629,
  "rider_earning": 3377,
  "platform_commission": 2252
}
```

### ✅ Frontend Behavior
1. **Cart Page**: Navigate to cart, check if delivery fees show
2. **Checkout Page**: Go to checkout, verify delivery fee matches cart
3. **Loading State**: Observe "Calculating..." and verify it disappears
4. **Multiple Vendors**: Add items from multiple restaurants, verify each has correct fee

---

## Future Enhancement Ideas

### 1. Caching
- Cache fee estimates for 5 minutes to reduce API calls
- Key: `${restaurantId}_${lat}_${lon}`

### 2. Real-Time Updates
- Re-estimate fee as buyer's location changes
- Debounce API calls to prevent throttling

### 3. Fee Breakdown Display
- Show distance: `36.86 km`
- Show rider earning: `₦3,377 (60%)`
- Show platform commission: `₦2,252 (40%)`

### 4. Error Recovery
- Retry with exponential backoff (already in service)
- Fallback to default fee if API fails
- User notification for failed estimation

### 5. Admin Dashboard
- Track average delivery fee by area
- Monitor platform commission earnings
- Fee tier management interface

---

## Files Modified

### Backend
- **dleva/rider/views.py**: Added `estimate_delivery_fee()` endpoint (+73 lines)
- **dleva/rider/urls.py**: Added route for endpoint (+2 lines)

### Frontend
- **dleva-frontend/src/services/deliveryService.js**: New file (140 lines)
- **dleva-frontend/src/modules/buyer/pages/Cart.jsx**: Refactored to use service
- **dleva-frontend/src/modules/buyer/pages/Checkout.jsx**: Refactored to use service

### Total Changes
- **Backend**: 2 files, ~75 lines added
- **Frontend**: 3 files modified, 1 new service file created

---

## Documentation

### For Developers

Adding delivery fee calculation to a new page:

```javascript
import { estimateDeliveryFee, formatDeliveryFee } from '../../../services/deliveryService';

// In your component
const [deliveryFee, setDeliveryFee] = useState(0);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchFee = async () => {
    setLoading(true);
    const result = await estimateDeliveryFee(restaurantId, buyerLat, buyerLon);
    if (result.success) {
      setDeliveryFee(result.deliveryFee);
    }
    setLoading(false);
  };
  
  fetchFee();
}, [restaurantId, buyerLat, buyerLon]);

// In your JSX
<div>
  {loading ? 'Calculating...' : formatDeliveryFee(deliveryFee)}
</div>
```

### For QA

Test Cases:
1. **Short distance (1 km)**: Should be ₦500
2. **Medium distance (5 km)**: Should be ₦700
3. **Long distance (10 km)**: Should be ₦1,600
4. **Network error**: Should show "Unable to calculate"
5. **Multiple vendors**: Each should show correct independent fee

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Pages                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Cart.jsx   │  │Checkout.jsx  │  │OrderList.jsx │  ...  │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│          │                 │                 │               │
│          └─────────────────┴─────────────────┘               │
│                         │                                    │
│            Uses deliveryService.js                           │
│                         │                                    │
│          ┌──────────────────────────────┐                    │
│          │  deliveryService.js          │                    │
│          │  ────────────────────────    │                    │
│          │  - estimateDeliveryFee()     │                    │
│          │  - formatDeliveryFee()       │                    │
│          │  - calculateDistance()       │                    │
│          └──────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                         │
                    HTTP POST
                  (restaurant_id, lat, lon)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Django)                                │
│          ┌────────────────────────────┐                      │
│          │ /api/rider/estimate-fee/   │                      │
│          │ ────────────────────────   │                      │
│          │  - Fetch restaurant        │                      │
│          │  - Calculate distance      │                      │
│          │  - Apply fee tiers         │                      │
│          │  - Return breakdown        │                      │
│          └────────────────────────────┘                      │
│                     │                                        │
│                     Uses: assignment_service.py             │
│                     ────────────────────────                │
│                     - calculate_distance()                  │
│                     - calculate_delivery_fee()              │
│                     - calculate_rider_earning()             │
└─────────────────────────────────────────────────────────────┘
                         │
                    HTTP Response
              (distance, fee, earnings, commission)
```

---

## Summary

✅ **Delivery fee calculations now properly handled**:
1. Backend API calculates and validates all fees
2. Frontend service centralizes API calls
3. All pages import and use the service
4. No code duplication
5. Easy to maintain and modify
6. Backend remains source of truth

✅ **Benefits**:
- Single calculation logic (no divergence)
- Consistent across all pages
- Easy A/B testing on fee tiers
- Audit trail (all fees tracked server-side)
- Can change logic instantly without frontend deploy

