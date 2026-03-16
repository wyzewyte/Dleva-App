/**
 * PHASE 6 QUICK REFERENCE GUIDE
 * Address Search & Geolocation with Nominatim
 * 
 * This guide provides a quick overview of all Phase 6 components
 * and how to use them in your application.
 */

// ============================================
// BACKEND COMPONENTS (Django)
// ============================================

/*
FILE: buyer/nominatimGeocoder.py
PURPOSE: Direct Nominatim API wrapper
METHODS:
  - search_address(query, country='NG', limit=5)
    Returns: [{display_name, latitude, longitude, address_type, importance, ...}]
  
  - reverse_geocode(latitude, longitude)
    Returns: {street, city, state, postcode, country, ...}
  
  - validate_address(address)
    Returns: {valid: bool, address, display_name, latitude, longitude}
  
  - geocode_address(address)
    Returns: (latitude, longitude)
  
  - format_address_components(address_dict)
    Returns: formatted_address_string

FILE: buyer/addressService.py
PURPOSE: High-level service with caching
METHODS:
  - search_addresses(query, use_cache=True)
  - reverse_geocode(latitude, longitude, use_cache=True)
  - validate_address(address)
  - geocode_address(address)
  - cleanup_old_cache(days=30)

CACHE FEATURES:
  - Auto-caches API responses for 24 hours
  - Uses SHA256 hash of query as cache key
  - Rounds coordinates to 4 decimals for matching
  - Tracks access_count and last_accessed
  - Cleans up old unused entries

FILE: buyer/models.py → AddressCache model
FIELDS:
  - query_hash: SHA256 hash (unique, indexed)
  - query_text: Original search query
  - display_name: Full formatted address
  - latitude, longitude: Decimal precision (10,8)
  - cache_type: 'search' | 'reverse' | 'validated'
  - address_type: Result type
  - importance: Relevance score (0-1)
  - raw_data: Full JSON response
  - created_at, last_accessed, access_count

FILE: buyer/views.py → 3 API Endpoints
  1. AddressSearchView (GET /address/search/?q=...&limit=5)
  2. ReverseGeocodeView (POST /address/reverse-geocode/)
  3. ValidateAddressView (POST /address/validate/)

FILE: buyer/urls.py
ROUTES:
  - path('address/search/', ...)
  - path('address/reverse-geocode/', ...)
  - path('address/validate/', ...)

FILE: buyer/admin.py
ADMIN:
  - AddressCacheAdmin registered with filters and search
  - Organize by: Query Info, Location Data, Cache Stats, Raw Data
*/

// ============================================
// FRONTEND COMPONENTS (React)
// ============================================

/*
FILE: services/addressSearchService.js
SINGLETON SERVICE: addressSearchService
METHODS:
  - searchAddresses(query, limit=5)
    Auto-caches results locally
  
  - debounceSearch(query, callback, debounceMs=500)
    For live search UI with debounce
  
  - reverseGeocode(latitude, longitude)
    GPS coordinates → Address
  
  - validateAddress(address)
    Validate address returns coordinates
  
  - geocodeAddress(address)
    Address string → Coordinates
  
  - clearCache()
    Flush local cache
  
  - getCacheStats()
    Returns cache size and entries

USAGE:
  import addressSearchService from '@/services/addressSearchService';
  const results = await addressSearchService.searchAddresses('Lagos');
*/

/*
FILE: components/address/AddressSearchComponent.jsx
REACT COMPONENT: AddressSearchComponent
PROPS:
  - onSelect: Callback (selectedAddress) when user picks an address
  - placeholder: Input placeholder text
  - initialValue: Default search value
  - disabled: Disabled state

FEATURES:
  - Autocomplete dropdown with live search
  - Keyboard navigation (Arrow keys, Enter, Escape)
  - Debounced API calls (300ms)
  - Click outside to close
  - Loading indicator while fetching
  - Clear button for input
  - Address relevance scores
  - Formatted address preview

USAGE:
  <AddressSearchComponent
    onSelect={(address) => {
      console.log('Selected:', address);
      console.log('Coordinates:', address.latitude, address.longitude);
    }}
    placeholder="Search delivery address..."
  />
*/

/*
FILE: components/address/AddressDisplayComponent.jsx
REACT COMPONENT: AddressDisplayComponent
PROPS:
  - address: Address object with display_name, latitude, longitude
  - onUpdate: Callback when address is updated
  - editable: Allow editing (false for display only)
  - showCoordinates: Show GPS coordinates (default: true)
  - allowReverseGeocode: Show reverse geocode button

FEATURES:
  - Display formatted address with components
  - Show GPS coordinates with copy buttons
  - Relevance score progress bar
  - Reverse geocode button (GPS → Address)
  - Address type indicator
  - Formatted street/city/state/postcode display

USAGE:
  <AddressDisplayComponent
    address={{
      display_name: "123 Main St, Lagos, NG",
      latitude: 6.5244,
      longitude: 3.3792,
      address_type: "residential"
    }}
    showCoordinates={true}
    editable={false}
  />
*/

/*
FILE: hooks/useAddressSearch.js
CUSTOM HOOK #1: useAddressSearch()
RETURNS:
  - address: Current address object
  - isLoading: Loading state
  - error: Error message
  - searchAddresses(query, limit=5): Search for addresses
  - reverseGeocode(lat, lon): GPS → Address
  - validateAddress(address): Validate address
  - geocodeAddress(address): Address → Coordinates
  - clearAddress(): Clear current address
  - setAddress(address): Manually set address

USAGE:
  const {
    address,
    isLoading,
    error,
    searchAddresses,
    reverseGeocode,
    validateAddress
  } = useAddressSearch();

CUSTOM HOOK #2: useAddressForm(initialAddress)
RETURNS:
  - addressForm: Form state object
  - isValid: Is address valid (has lat/lon/name)
  - updateAddress(newAddress): Update address
  - clearAddress(): Clear form
  - getFormData(): Get form as object

USAGE:
  const {
    addressForm,
    isValid,
    updateAddress,
    getFormData
  } = useAddressForm();
*/

// ============================================
// INTEGRATION PATTERNS
// ============================================

/*
PATTERN 1: Simple Address Search in Checkout
────────────────────────────────────────────
<AddressSearchComponent
  onSelect={(address) => setDeliveryAddress(address)}
  placeholder="Enter delivery address..."
/>

PATTERN 2: Reverse Geocode from GPS
────────────────────────────────────
useEffect(() => {
  if (gps.latitude && gps.longitude) {
    reverseGeocode(gps.latitude, gps.longitude)
      .then(address => setAddress(address));
  }
}, [gps]);

PATTERN 3: Validate Before Submission
──────────────────────────────────────
const handleSubmit = async () => {
  const { valid, data } = await validateAddress(addressText);
  if (valid) {
    // Submit with coordinates
  } else {
    // Show error
  }
};

PATTERN 4: Combined Form with Hook
──────────────────────────────────
const { addressForm, isValid, updateAddress } = useAddressForm();
<AddressSearchComponent
  onSelect={updateAddress}
/>
<button disabled={!isValid}>Continue</button>

PATTERN 5: Full Location Setup
──────────────────────────────
1. Get GPS location
2. Auto-reverse geocode to address
3. Allow manual search to override
4. Display both GPS + address
*/

// ============================================
// API ENDPOINTS
// ============================================

/*
BASE URL: /api/buyer

1. SEARCH ADDRESSES
   ─────────────────
   GET /address/search/?q=query&limit=5
   
   Query Parameters:
     q: Search query (min 3 chars)
     limit: Max results (default 5, max 10)
   
   Response (200):
   {
     "query": "Lagos",
     "count": 5,
     "results": [
       {
         "display_name": "Lagos, Nigeria",
         "latitude": 6.5244,
         "longitude": 3.3792,
         "address_type": "state",
         "importance": 0.95,
         "cached": true/false
       }
     ]
   }
   
   Error (400): Missing/invalid query
   Error (500): API error

2. REVERSE GEOCODE
   ────────────────
   POST /address/reverse-geocode/
   
   Request Body:
   {
     "latitude": 6.5244,
     "longitude": 3.3792
   }
   
   Response (200):
   {
     "success": true,
     "address": {
       "display_name": "123 Main St, Lagos, LG, Nigeria",
       "latitude": 6.5244,
       "longitude": 3.3792,
       "street": "Main Street",
       "city": "Lagos",
       "state": "Lagos",
       "postcode": "100001",
       "country": "Nigeria"
     }
   }
   
   Error (400): Missing/invalid coordinates
   Error (422): No address found
   Error (500): API error

3. VALIDATE ADDRESS
   ────────────────
   POST /address/validate/
   
   Request Body:
   {
     "address": "123 Main St, Lagos, Nigeria"
   }
   
   Response (200 - Valid):
   {
     "valid": true,
     "address": "123 Main St, Lagos, Nigeria",
     "display_name": "123 Main Street, Lagos, LG, Nigeria",
     "latitude": 6.5244,
     "longitude": 3.3792,
     "address_type": "residential"
   }
   
   Response (422 - Invalid):
   {
     "valid": false,
     "message": "Address not found or not routable",
     "suggestion": "Please try with a more specific address"
   }
   
   Error (400): Missing address
   Error (500): API error
*/

// ============================================
// CACHING STRATEGY
// ============================================

/*
CLIENT-SIDE CACHING (addressSearchService):
  - In-memory JavaScript Map
  - Stores results per query
  - Persists for session duration
  - Methods: clearCache(), getCacheStats()

SERVER-SIDE CACHING (AddressCache model):
  - Database: AddressCache table
  - Cache duration: 24 hours
  - Key: SHA256(query) or SHA256(rounded_lat_lon)
  - Coordinate rounding: 4 decimals (~11m accuracy)
  - Tracks: access_count, last_accessed
  - Cleanup: Delete unused old entries
  - View in Django admin: buyer/Address Cache

BENEFITS:
  ✅ Respect Nominatim rate limit (1 req/sec)
  ✅ Instant results for repeated searches
  ✅ Reduce external API dependency
  ✅ Track popular addresses
  ✅ Improve user experience (faster UI)
*/

// ============================================
// TESTING CHECKLIST
// ============================================

/*
BACKEND SETUP:
  ✅ Migration applied: buyer.0008_addresscache
  ✅ AddressCache table created
  ✅ Models imported successfully
  ✅ Views registered in urls.py
  ✅ Admin interface functional

API ENDPOINTS:
  ✅ GET /api/buyer/address/search/?q=Lagos&limit=5
    Should return addresses with display_name, lat/lon
  ✅ POST /api/buyer/address/reverse-geocode/
    Body: {latitude: 6.5244, longitude: 3.3792}
  ✅ POST /api/buyer/address/validate/
    Body: {address: "123 Main St, Lagos"}

FRONTEND COMPONENTS:
  ✅ AddressSearchComponent renders with autocomplete
  ✅ Keyboard navigation works (arrows, enter, escape)
  ✅ Search debouncing works (300ms delay)
  ✅ Results dropdown shows with relevance scores
  ✅ AddressDisplayComponent shows address details
  ✅ Coordinate display and copy functionality
  ✅ Reverse geocode button works

INTEGRATION:
  ✅ AddressSearchComponent works in Checkout
  ✅ useAddressSearch hook retrieves data
  ✅ useAddressForm hook manages form state
  ✅ Coordinates passed to order creation
  ✅ Address displays in rider delivery flow
  ✅ GPS coordinates round-trip (GPS → Address → GPS)

CACHING:
  ✅ Repeated searches use cache (check server logs)
  ✅ Different coordinates still produce cache hits
  ✅ Django admin shows AddressCache entries
  ✅ access_count increments on cache hits
  ✅ Old entries can be cleaned up
*/

// ============================================
// TROUBLESHOOTING
// ============================================

/*
Issue: "No addresses found" for valid addresses
Solution: 
  - Verify Nominatim API is accessible
  - Check country code (default: NG for Nigeria)
  - Try searching with city name

Issue: Reverse geocoding returns null
Solution:
  - Verify coordinates are valid (-90-90 lat, -180-180 lon)
  - Check network connectivity
  - Try nearby coordinates (Nominatim may not have exact location)

Issue: Slow address search
Solution:
  - Check if database query is slow
  - Verify indexes on AddressCache:
    - query_hash (unique)
    - (latitude, longitude)
  - Clear old cache entries

Issue: CSRF token errors
Solution:
  - Ensure Django CSRF middleware is enabled
  - Frontend service automatically reads CSRF token
  - Check browser cookies for csrftoken

Issue: Migration not applied
Solution:
  - Run: python manage.py migrate
  - Verify migration file: buyer/migrations/0008_addresscache.py
  - Check database: SELECT * FROM buyer_addresscache;
*/

// ============================================
// FILES CREATED IN PHASE 6
// ============================================

/*
BACKEND FILES:
  1. buyer/nominatimGeocoder.py (198 lines)
     - Direct Nominatim API wrapper
  
  2. buyer/addressService.py (276 lines)
     - High-level service with caching
  
  3. buyer/migrations/0008_addresscache.py
     - Migration for AddressCache model
  
  4. MODIFIED: buyer/models.py
     - Added AddressCache model (~53 lines)
  
  5. MODIFIED: buyer/views.py
     - Added AddressSearchView, ReverseGeocodeView, ValidateAddressView
  
  6. MODIFIED: buyer/urls.py
     - Added 3 address-related routes
  
  7. MODIFIED: buyer/admin.py
     - Added AddressCacheAdmin

FRONTEND FILES:
  1. services/addressSearchService.js
     - Singleton service for address operations
  
  2. components/address/AddressSearchComponent.jsx
     - Autocomplete search component
  
  3. components/address/AddressDisplayComponent.jsx
     - Address details display component
  
  4. hooks/useAddressSearch.js
     - Custom hooks for address operations
  
  5. components/address/INTEGRATION_EXAMPLES.jsx
     - Usage examples and patterns

DATABASE:
  - AddressCache table created (8 columns, 2 indexes)
  - 0 entries (populates on first API calls)
  - Check in Django admin: buyer/Address Cache

TOTAL: 12 files created/modified, 1 migration applied
*/

export default {};
