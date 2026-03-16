## Phase 1: Data Model & Database Cleanup (1-2 weeks)

**Goal:** Establish a single source of truth for all location data in the backend.

* Add `current_location` fields to User profiles (for buyers/riders) and Restaurant models (for sellers).
* Create a `LocationHistory` model to track all location changes with timestamps (for fraud detection).
* Synchronize rider location data consistently to prevent database mismatches.
* Create a location history tracker to log movements for fraud detection and analytics.
* Standardize database fields so all coordinates and distances use the same format (DecimalField with 8 decimal precision).
* Build a centralized location validator to prevent location spoofing and unrealistic coordinate jumps (e.g., >100km in <1 minute).

---

## Phase 2: Backend Location Service Layer

**Goal:** Centralize all location operations behind a unified service API.

* Create a single service class to handle all location updates, nearby rider queries, and service area validations.
* Consolidate all distance and fee calculation math into one single source of truth.
* Update the rider assignment logic to use this new centralized service.
* Create clean, dedicated API endpoints for:
  - Saving/updating user location (GET & POST to persist current location)
  - Getting location history and recent locations
  - Estimating delivery fees based on new location
  - Filtering restaurants by current location
  - Geocoding endpoint (/api/geocode/) to convert address → lat/long
  - Reverse geocoding to convert lat/long → readable address

---

## Phase 3: Frontend Location Service Layer & Top Bar Location Selector (1.5-2 weeks)

**Goal:** Abstract all location logic into a single frontend service manager with persistent location UI.

* Build a unified frontend service to handle GPS requests, distance calculations, and API calls.
* Implement a global location state so the user's location is easily accessible across the entire app.
* **Create a persistent top-bar location selector component** (next to profile picture) that allows users to:
  - View their current selected location
  - Change location anytime without page reload
  - Use GPS auto-detection with one tap
  - Search and pick addresses from autocomplete
  - See recent locations for quick access
* Update the location setup screens to smoothly handle auto-detection, manual entry, and permission errors.
* Refactor the checkout, cart, and restaurant list pages to use this new location manager and trigger real-time updates when location changes.
* Implement frontend location manager with GPS + address search

---

## Phase 4: Real-Time Tracking Infrastructure

**Goal:** Replace manual refreshing with real-time WebSocket updates.

* Enhance backend WebSockets to broadcast rider locations and automatically calculate updated ETAs.
* Set up automated signals to instantly push order status changes to buyers and sellers.
* Build a frontend tracking client to securely connect to these real-time streams.
* Update the order tracking UI to move the rider on the screen and update the ETA dynamically.

---

## Phase 5: GPS Integration

**Goal:** Introduce optional, battery-efficient GPS tracking.

* Build a background GPS tracking service that periodically updates the user's location.
* Add permission prompts during the checkout or delivery phase to ask buyers if they want to share their live location for easier drop-offs.
* Ensure the system falls back gracefully if the user denies location permissions.

---

## Phase 6: Geolocation & Address Validation (1-1.5 weeks) 
we are going to use Nominatim (free)
Use Nominatim API from OpenStreetMap (free)

**Goal:** Improve address handling, search, and accuracy.

* Integrate a geocoding service to seamlessly convert map coordinates into readable addresses (and vice versa).
* Add a backend validation step to ensure entered addresses are real and routable.
* Build an address autocomplete search bar for the frontend to speed up user onboarding and reduce typos.
* Integrate Nominatim for address validation & reverse geocoding

---

## Phase 7: Map Visualization & Analytics (1.5-2 weeks)
we are going to use Leaflet (free)
Use Leaflet + OpenStreetMap tiles (free)

**Goal:** Add visual maps and historical data for users.

* Integrate a map library into the frontend applications.
* Build a live delivery map component showing the restaurant, the buyer, the rider, and the route.
* Create a delivery history dashboard for buyers to view past orders, route history, and delivery analytics.
* Add map picker UI with Leaflet


📝 Next Steps (Optional Enhancements)
Add visual map component (react-leaflet or Google Maps)
Add rider info card (name, rating, vehicle)
Add distance display (km remaining)
Add audio notification on delivery
Test with multiple concurrent orders
Add ETA countdown timer (mm:ss format)