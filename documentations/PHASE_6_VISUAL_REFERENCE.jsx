/**
 * PHASE 6 - VISUAL REFERENCE GUIDE
 * Quick visual overview of all components, files, and how they connect
 */

// ============================================================
// FILE STRUCTURE (What Was Created)
// ============================================================

/*
PROJECT ROOT
│
├── dleva/                          [Backend - Django]
│   └── buyer/
│       ├── nominatimGeocoder.py    ✅ NEW (198 lines)
│       │   ├── search_address()
│       │   ├── reverse_geocode()
│       │   ├── validate_address()
│       │   ├── geocode_address()
│       │   └── format_address_components()
│       │
│       ├── addressService.py       ✅ NEW (276 lines)
│       │   ├── search_addresses()     [+ caching]
│       │   ├── reverse_geocode()      [+ caching]
│       │   ├── validate_address()
│       │   ├── geocode_address()
│       │   └── cleanup_old_cache()
│       │
│       ├── models.py               ✅ MODIFIED
│       │   └── AddressCache model
│       │       ├── query_hash        [indexed, unique]
│       │       ├── display_name
│       │       ├── latitude
│       │       ├── longitude
│       │       ├── cache_type
│       │       ├── address_type
│       │       ├── importance
│       │       └── raw_data
│       │
│       ├── views.py                ✅ MODIFIED
│       │   ├── AddressSearchView
│       │   │   └── GET /address/search/?q=...
│       │   ├── ReverseGeocodeView
│       │   │   └── POST /address/reverse-geocode/
│       │   └── ValidateAddressView
│       │       └── POST /address/validate/
│       │
│       ├── urls.py                 ✅ MODIFIED
│       │   ├── path('address/search/', ...)
│       │   ├── path('address/reverse-geocode/', ...)
│       │   └── path('address/validate/', ...)
│       │
│       ├── admin.py                ✅ MODIFIED
│       │   └── AddressCacheAdmin
│       │       ├── List filters
│       │       ├── Search fields
│       │       ├── Read-only fields
│       │       └── Fieldsets
│       │
│       └── migrations/
│           └── 0008_addresscache.py ✅ NEW (APPLIED)
│               ├── CreateModel
│               └── AddIndex (x2)
│
├── dleva-frontend/                 [Frontend - React]
│   └── src/
│       ├── services/
│       │   └── addressSearchService.js  ✅ NEW
│       │       ├── searchAddresses()
│       │       ├── debounceSearch()
│       │       ├── reverseGeocode()
│       │       ├── validateAddress()
│       │       └── geocodeAddress()
│       │
│       ├── components/address/
│       │   ├── AddressSearchComponent.jsx    ✅ NEW
│       │   │   ├── Autocomplete input
│       │   │   ├── Dropdown results
│       │   │   ├── Keyboard nav
│       │   │   └── Debounce (300ms)
│       │   │
│       │   ├── AddressDisplayComponent.jsx   ✅ NEW
│       │   │   ├── Address details
│       │   │   ├── Coordinates display
│       │   │   ├── Copy buttons
│       │   │   ├── Reverse geocode btn
│       │   │   └── Relevance bar
│       │   │
│       │   ├── INTEGRATION_EXAMPLES.jsx      ✅ NEW
│       │   │   ├── Example 1: Checkout
│       │   │   ├── Example 2: Validation
│       │   │   ├── Example 3: Current location
│       │   │   ├── Example 4: GPS + Address
│       │   │   └── Example 5: Rider tracking
│       │   │
│       │   ├── PHASE_6_QUICK_REFERENCE.md   ✅ NEW
│       │   │   ├── Component APIs
│       │   │   ├── Hook documentation
│       │   │   ├── API endpoints
│       │   │   └── Caching strategy
│       │   │
│       │   └── PHASE_6_COMPLETION_SUMMARY.jsx ✅ NEW
│       │       ├── Backend summary
│       │       ├── Frontend summary
│       │       ├── Integration checklist
│       │       └── Testing guide
│       │
│       └── hooks/
│           └── useAddressSearch.js          ✅ NEW
│               ├── useAddressSearch()
│               │   ├── address state
│               │   ├── isLoading
│               │   ├── error
│               │   ├── searchAddresses()
│               │   ├── reverseGeocode()
│               │   ├── validateAddress()
│               │   ├── geocodeAddress()
│               │   ├── clearAddress()
│               │   └── setAddress()
│               │
│               └── useAddressForm()
│                   ├── addressForm state
│                   ├── isValid
│                   ├── updateAddress()
│                   ├── clearAddress()
│                   └── getFormData()
│
├── PHASE_6_IMPLEMENTATION_COMPLETE.md       ✅ REFERENCE
├── PHASE_6_ARCHITECTURE_GUIDE.jsx           ✅ REFERENCE
├── PHASE_6_SUMMARY_FINAL.md                 ✅ REFERENCE
└── (This file)                              ✅ REFERENCE

TOTAL: 14 files created/modified, 1 migration applied
*/

// ============================================================
// COMPONENT INTERACTION FLOW
// ============================================================

/*
SCENARIO: User selects delivery address in checkout

┌─────────────────────────────────────────────────────────────┐
│           FRONTEND - React Components                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Checkout Component                                         │
│  │                                                          │
│  ├─ useAddressForm()  ←─────────────────────┐              │
│  │  ├─ addressForm state                    │              │
│  │  ├─ isValid = false initially            │              │
│  │  └─ updateAddress() method               │              │
│  │                                          │              │
│  └─ <AddressSearchComponent                 │              │
│     onSelect={(addr) => updateAddress()} ──┤              │
│     │                                       │              │
│     ├─ Input field (user types)             │              │
│     │  └─ onChange() called                 │              │
│     │     └─ addressSearchService           │              │
│     │        .debounceSearch(query, cb) ────┼─→ Wait 300ms │
│     │                                       │              │
│     ├─ Dropdown (results shown)             │              │
│     │  ├─ Keyboard navigation ↑↓            │              │
│     │  ├─ Click result                      │              │
│     │  └─ onSelect() callback ──────────────┤              │
│     │                                       │              │
│     └─ Updates: isValid = true (if has coords)             │
│                                                            │
│  Button "Continue" now enabled                            │
│  (disabled={!isValid})                                    │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        FRONTEND SERVICE - addressSearchService              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  searchAddresses("Lagos")                                  │
│  │                                                          │
│  ├─ Check local cache (Map): "search_lagos"               │
│  │  ├─ CACHE HIT   → Return cached results                │
│  │  └─ CACHE MISS  → Continue...                          │
│  │                                                          │
│  ├─ fetch('/api/buyer/address/search/?q=Lagos')           │
│  │  ├─ Headers: Content-Type, CSRF token                  │
│  │  └─ Method: GET                                         │
│  │                                                          │
│  └─ Store in local cache for next time                    │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         BACKEND VIEWS - Django REST Endpoints              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AddressSearchView                                         │
│  │                                                          │
│  ├─ GET /api/buyer/address/search/?q=Lagos&limit=5        │
│  │  ├─ Validate: q length ≥ 3 ✓                           │
│  │  ├─ Validate: limit ≤ 10 ✓                             │
│  │  └─ Call: AddressService.search_addresses()            │
│  │                                                          │
│  └─ Returns: 200 {query, count, results}                  │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│      BACKEND SERVICES - Business Logic Layer               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AddressService.search_addresses("Lagos")                  │
│  │                                                          │
│  ├─ Check AddressCache (database)                          │
│  │  cache_key = SHA256("Lagos")                           │
│  │  ├─ DB HIT   → Return cached result                    │
│  │  │   (increment access_count)                          │
│  │  │                                                      │
│  │  └─ DB MISS  → Continue...                             │
│  │                                                          │
│  ├─ Call: NominatimGeocoder.search_address("Lagos")       │
│  │  │                                                      │
│  │  └─ Results: [{display_name, lat, lon, ...}]           │
│  │                                                          │
│  ├─ Save to AddressCache (for next time)                  │
│  │  ├─ query_hash = SHA256("Lagos")                      │
│  │  ├─ query_text = "Lagos"                               │
│  │  ├─ display_name, lat, lon, importance, etc.           │
│  │  ├─ cache_type = "search"                              │
│  │  └─ created_at = now()                                 │
│  │                                                          │
│  └─ Return results to view                                │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│      NOMINATIM API WRAPPER - Direct Integration            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NominatimGeocoder.search_address("Lagos")                 │
│  │                                                          │
│  ├─ Build request:                                        │
│  │  ├─ URL: nominatim.openstreetmap.org/search            │
│  │  ├─ Query: "Lagos"                                     │
│  │  ├─ Country: "NG" (Nigeria)                            │
│  │  ├─ Format: "json"                                     │
│  │  └─ Limit: 5 (default)                                 │
│  │                                                          │
│  ├─ Send HTTP request (timeout: 10s)                      │
│  │  ├─ User agent: Custom                                 │
│  │  └─ Error handling: RequestException caught            │
│  │                                                          │
│  └─ Parse response JSON                                   │
│     ├─ Extract: display_name, lat, lon, importance        │
│     └─ Filter: importance > 0                             │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│    NOMINATIM API (External - OpenStreetMap)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Query: "Lagos, Nigeria"                                   │
│  Response: JSON with matching addresses                    │
│                                                            │
│  [                                                          │
│    {                                                        │
│      "display_name": "Lagos, Nigeria",                     │
│      "lat": "6.5244",                                      │
│      "lon": "3.3792",                                      │
│      "importance": 0.95,                                   │
│      "address_type": "state",                              │
│      ...other fields                                       │
│    },                                                       │
│    ...more results                                         │
│  ]                                                          │
│                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
          [Response flows back through stack]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         FRONTEND - Dropdown shows results                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Results displayed in dropdown:                            │
│  ┌──────────────────────────┐                              │
│  │ 📍 Lagos, Nigeria        │ ← Relevance: 95%             │
│  │    state                 │                              │
│  ├──────────────────────────┤                              │
│  │ 📍 Lagos State, Nigeria  │ ← Relevance: 85%             │
│  │    administrative        │                              │
│  └──────────────────────────┘                              │
│                                                              │
│  User clicks → onSelect() → updateAddress()               │
│               → addressForm updated                        │
│               → isValid = true                             │
│               → Button enabled                            │
│                                                            │
└─────────────────────────────────────────────────────────────┘
*/

// ============================================================
// CACHING EFFICIENCY VISUALIZATION
// ============================================================

/*
SCENARIO: Multiple users searching "Lagos" in one day

┌─────────────────────────────────────────────────────────────┐
│  First User Search: "Lagos"                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Cache (addressSearchService) - MISS                │
│         ↓                                                    │
│  Server Request → API /address/search/?q=Lagos             │
│         ↓                                                    │
│  Server Cache (AddressCache) - MISS                         │
│         ↓                                                    │
│  Nominatim API call (1/sec rate limit used)                │
│         ↓                                                    │
│  Result: [{Lagos results}]                                 │
│         ↓                                                    │
│  Cache in AddressCache (database)                          │
│  ├─ query_hash = "abc123def456..." [SHA256("Lagos")]      │
│  ├─ created_at = 2024-03-01 10:00:00                      │
│  ├─ access_count = 1                                       │
│  └─ last_accessed = 2024-03-01 10:00:00                   │
│         ↓                                                    │
│  Response to client                                        │
│         ↓                                                    │
│  Cache in client (addressSearchService Map)               │
│                                                             │
│  RESPONSE TIME: ~200ms (API call)                          │
│  API CALLS: 1 (Nominatim)                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    ↓
         [20 minutes later]
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Second User Search: "Lagos"                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Cache (addressSearchService) - HIT ✓               │
│         ↓                                                    │
│  Return result instantly (from JavaScript Map)             │
│                                                             │
│  RESPONSE TIME: <10ms (no network call!)                   │
│  API CALLS: 0 (cache hit)                                  │
│                                                             │
│  [No backend call needed]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    ↓
         [Next search by same user]
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Third User Search: "Lagos"                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Cache - MISS (new browser/session)                 │
│         ↓                                                    │
│  Server Request → API /address/search/?q=Lagos             │
│         ↓                                                    │
│  Server Cache (AddressCache) - HIT ✓                        │
│  ├─ Check: query_hash = "abc123def456..."                 │
│  ├─ Found: last_accessed = 2024-03-01 10:20:00            │
│  ├─ Check: 24 hours passed? NO → Valid                     │
│  ├─ Increment: access_count = 2 ← Now shows as popular     │
│  └─ Update: last_accessed = 2024-03-01 10:25:00           │
│         ↓                                                    │
│  Return cached result (from database)                      │
│         ↓                                                    │
│  Response to client                                        │
│         ↓                                                    │
│  Cache in client (addressSearchService Map)               │
│                                                             │
│  RESPONSE TIME: ~50ms (database lookup)                    │
│  API CALLS: 0 (database cache)                             │
│                                                             │
│  [No external API call needed]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

RESULT AFTER ONE DAY:
────────────────────
User Searches: 100
Nominatim API Calls: 1 (first time only)
Database Cache Hits: 99
Average Response: 45ms (vs 200ms without cache)
API Cost Saved: 99 calls prevented
User Experience: Instant results after warm-up
*/

// ============================================================
// API ENDPOINTS AT A GLANCE
// ============================================================

/*
┌─────────────────────────────────────────────────────────────┐
│ ENDPOINT 1: Address Search                                  │
├─────────────────────────────────────────────────────────────┤
│ Method:  GET                                                │
│ URL:     /api/buyer/address/search/?q=Lagos&limit=5        │
│ Query:   q (min 3 chars), limit (max 10)                   │
│          Example: /address/search/?q=Lekki%20Phase&limit=3 │
│                                                             │
│ Success:  200 OK                                            │
│ {                                                           │
│   "query": "Lagos",                                         │
│   "count": 5,                                               │
│   "results": [                                              │
│     {                                                       │
│       "display_name": "Lagos, Nigeria",                     │
│       "latitude": 6.5244,                                   │
│       "longitude": 3.3792,                                  │
│       "address_type": "state",                              │
│       "importance": 0.95,                                   │
│       "address": "Lagos, Nigeria",                          │
│       "cached": true                                        │
│     },                                                      │
│     ...more results                                         │
│   ]                                                         │
│ }                                                           │
│                                                             │
│ Error 400: {"error": "Query too short"}                    │
│ Error 500: {"error": "API error"}                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ENDPOINT 2: Reverse Geocode (GPS → Address)                │
├─────────────────────────────────────────────────────────────┤
│ Method:  POST                                               │
│ URL:     /api/buyer/address/reverse-geocode/               │
│ Headers: Content-Type: application/json                    │
│          X-CSRFToken: [token]                              │
│                                                             │
│ Request:                                                    │
│ {                                                           │
│   "latitude": 6.5244,                                       │
│   "longitude": 3.3792                                       │
│ }                                                           │
│                                                             │
│ Success:  200 OK                                            │
│ {                                                           │
│   "success": true,                                          │
│   "address": {                                              │
│     "display_name": "Falako Street, Ikoyi, Lagos, Nigeria", │
│     "latitude": 6.5244,                                     │
│     "longitude": 3.3792,                                    │
│     "street": "Falako Street",                              │
│     "city": "Lagos",                                        │
│     "state": "Lagos",                                       │
│     "postcode": "101271",                                   │
│     "country": "Nigeria"                                    │
│   }                                                         │
│ }                                                           │
│                                                             │
│ Error 400: {"error": "Missing latitude/longitude"}         │
│ Error 422: {"error": "Address not found"}                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ENDPOINT 3: Validate Address                                │
├─────────────────────────────────────────────────────────────┤
│ Method:  POST                                               │
│ URL:     /api/buyer/address/validate/                      │
│ Headers: Content-Type: application/json                    │
│          X-CSRFToken: [token]                              │
│                                                             │
│ Request:                                                    │
│ {                                                           │
│   "address": "123 Main St, Lagos, Nigeria"                 │
│ }                                                           │
│                                                             │
│ Success (Valid):  200 OK                                    │
│ {                                                           │
│   "valid": true,                                            │
│   "address": "123 Main St, Lagos, Nigeria",                 │
│   "display_name": "123, Main Street, Lagos, Nigeria",       │
│   "latitude": 6.4344,                                       │
│   "longitude": 3.5765,                                      │
│   "address_type": "residential"                             │
│ }                                                           │
│                                                             │
│ Success (Invalid): 422 Unprocessable                        │
│ {                                                           │
│   "valid": false,                                           │
│   "message": "Address not found or not routable",           │
│   "suggestion": "Try with a more specific address or..."    │
│ }                                                           │
│                                                             │
│ Error 400: {"error": "Missing address"}                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// ============================================================
// DJANGO ADMIN CACHE INTERFACE
// ============================================================

/*
ACCESS: https://yoursite.com/admin/buyer/addresscache/

┌─────────────────────────────────────────────────────────────┐
│            Django Admin - Address Cache                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Filters (Right Sidebar):                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Cache type:                                             │ │
│ │  ○ All (20 entries)                                    │ │
│ │  ○ search (15)                                         │ │
│ │  ○ reverse (3)                                         │ │
│ │  ○ validated (2)                                       │ │
│ │                                                        │ │
│ │ Created Date:                                          │ │
│ │  ○ Today                                               │ │
│ │  ○ This week                                           │ │
│ │  ○ This month                                          │ │
│ │  ○ Any date                                            │ │
│ │                                                        │ │
│ │ Importance:                                            │ │
│ │  ○ > 0.9                                               │ │
│ │  ○ 0.5 - 0.9                                           │ │
│ │  ○ < 0.5                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Results Table:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Display Name    │ Type │ Coordinates │ Hits │ Created   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Lagos, Nigeria  │ search │ 6.52, 3.37 │ 45  │ Mar 1 10: │ │
│ │ Ikoyi, Lagos    │ search │ 6.53, 3.50 │ 28  │ Mar 1 10: │ │
│ │ Lekki Phase 1   │ search │ 6.43, 3.57 │ 19  │ Mar 1 11: │ │
│ │ [address3]      │ reverse│ 6.52, 3.37 │ 12  │ Mar 1 11: │ │
│ │ [more entries]  │       │            │     │           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Click entry to see details:                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query Info:                                             │ │
│ │  Query Hash: abc123def456... (SHA256)                  │ │
│ │  Query Text: Lagos                                      │ │
│ │                                                        │ │
│ │ Location Data:                                          │ │
│ │  Display Name: Lagos, Nigeria                           │ │
│ │  Latitude: 6.5244                                       │ │
│ │  Longitude: 3.3792                                      │ │
│ │  Address Type: state                                    │ │
│ │  Importance: 0.95 (95%)                                 │ │
│ │                                                        │ │
│ │ Cache Stats (collapsed):                                │ │
│ │  Cache Type: search                                     │ │
│ │  Created At: 2024-03-01 10:00:00                       │ │
│ │  Last Accessed: 2024-03-01 10:25:00                    │ │
│ │  Access Count: 45                                       │ │
│ │                                                        │ │
│ │ Raw Data (collapsed):                                   │ │
│ │  {Full JSON from Nominatim API}                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
*/

// ============================================================
// KEY METRICS & STATS
// ============================================================

/*
WHAT TO MONITOR:

1. Cache Hit Ratio
   ─────────────────
   = (Total cache hits) / (Total API requests)
   Target: > 80% after warm-up (24 hours)
   
   How to calculate:
   - Total API calls to Nominatim = # of searches with (cached=false)
   - Total cache hits = # of searches with (cached=true)
   
   Example:
   - 100 searches today
   - 95 were cache hits (cached=true)
   - Hit ratio: 95%

2. Popular Addresses (Top 10)
   ─────────────────────────
   SELECT display_name, access_count
   FROM buyer_addresscache
   ORDER BY access_count DESC
   LIMIT 10
   
   Use this to:
   - Find most searched locations
   - Identify popular areas
   - Plan pre-caching

3. Cache Age
   ──────────
   SELECT COUNT(*) as old_entries
   FROM buyer_addresscache
   WHERE created_at < NOW() - INTERVAL 30 DAY
   AND access_count < 5
   
   Action: Clean up old low-hit entries

4. API Performance
   ────────────────
   Track response time per endpoint:
   - /address/search/: Should be < 200ms (first call)
   - /address/reverse-geocode/: Should be < 500ms
   - /address/validate/: Should be < 500ms
   
   After cache warm-up: All should be < 50ms

5. Database Size
   ──────────────
   SELECT COUNT(*) as total_cached,
          ROUND(SUM(OCTET_LENGTH(raw_data))/1024/1024, 2) as size_mb
   FROM buyer_addresscache
   
   Monitor for growth. Clean up as needed.
*/

// ============================================================
// ERROR RECOVERY FLOWS
// ============================================================

/*
SCENARIO: Nominatim API is down

User Search:
  ↓
Frontend requests /address/search/?q=Lagos
  ↓
Backend checks AddressCache
  ├─ Found cached result? YES → Return it
  │                          (even if old)
  │
  └─ Not found? Try Nominatim API
      ├─ Connection timeout
      ├─ 500 error
      └─ Response parsing error
      
      → Return empty results to user
      → Show: "No addresses found. Try different search."
      → User can retry later

SCENARIO: Invalid GPS coordinates from device

GPS returns: latitude=999, longitude=999
  ↓
Frontend call: reverseGeocode(999, 999)
  ↓
Backend validates coordinates
  ├─ latitude range? -90 < 999 < 90? NO
  │
  └─ Return error: "Invalid coordinates"
  
  → Frontend catches error
  → Show: "Could not determine your location"
  → Display raw coordinates with: 📍 Unknown location
  → Fallback: Manual address search

SCENARIO: Network timeout (slow connection)

User: Types "Lagos", hits enter
  ↓
addressSearchService.searchAddresses()
  ├─ fetch() times out after 10s
  │
  └─ Return: []
  
  → frontend shows: "Network error. Please retry."
  → User can tap "Retry" button
  → addressSearchService tries again automatically

SCENARIO: User's session expired (CSRF token invalid)

User: Tries to validate address
  ↓
Frontend POST /api/buyer/address/validate/
  ├─ Includes CSRF token from cookie
  ├─ Token has expired or is invalid
  │
  └─ Backend returns: 403 Forbidden
  
  → Frontend catches 403
  → Shows: "Session expired. Please refresh page."
  → User refreshes (gets new token)
  → Retry succeeds
*/

export default {};
