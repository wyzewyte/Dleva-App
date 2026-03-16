/**
 * PHASE 6 ADDRESS SEARCH INTEGRATION EXAMPLES
 * 
 * This file demonstrates how to use the address search components
 * and hooks throughout the application.
 */

// Example 1: Using AddressSearchComponent in Checkout
// ====================================================

import AddressSearchComponent from './components/address/AddressSearchComponent';
import { useAddressForm } from './hooks/useAddressSearch';

function CheckoutPage() {
  const { addressForm, isValid, updateAddress, getFormData } =
    useAddressForm();

  const handleAddressSelect = (selectedAddress) => {
    console.log('Address selected:', selectedAddress);
    updateAddress(selectedAddress);
  };

  const handleCheckout = () => {
    if (!isValid) {
      alert('Please select a valid delivery address');
      return;
    }

    const deliveryAddress = getFormData();
    console.log('Delivery address:', deliveryAddress);
    // Submit to backend
  };

  return (
    <div className="checkout-container">
      <h2>Delivery Address</h2>

      {/* Address Search Input */}
      <AddressSearchComponent
        onSelect={handleAddressSelect}
        placeholder="Enter delivery address..."
      />

      {/* Show selected address if valid */}
      {isValid && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="font-medium text-green-800">
            ✓ Address confirmed
          </p>
          <p className="text-sm text-green-700 mt-1">
            {addressForm.display_name}
          </p>
          <p className="text-xs text-green-600 mt-2">
            Coordinates: {addressForm.latitude.toFixed(6)},
            {addressForm.longitude.toFixed(6)}
          </p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={!isValid}
        className="mt-4 w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
      >
        Continue to Payment
      </button>
    </div>
  );
}

// Example 2: Using useAddressSearch Hook for Manual Validation
// =============================================================

import { useAddressSearch } from './hooks/useAddressSearch';

function AddressValidationForm() {
  const {
    address,
    isLoading,
    error,
    validateAddress,
    reverseGeocode,
    clearAddress,
  } = useAddressSearch();

  const [manualAddress, setManualAddress] = useState('');

  const handleValidate = async () => {
    const result = await validateAddress(manualAddress);
    if (result.valid) {
      console.log('Address is valid:', address);
    }
  };

  return (
    <div>
      <input
        value={manualAddress}
        onChange={(e) => setManualAddress(e.target.value)}
        placeholder="Enter address to validate"
      />
      <button onClick={handleValidate} disabled={isLoading}>
        {isLoading ? 'Validating...' : 'Validate'}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {address && (
        <div className="mt-4">
          <p className="font-medium">{address.display_name}</p>
          <p className="text-sm">
            Lat: {address.latitude}, Lon: {address.longitude}
          </p>
        </div>
      )}
    </div>
  );
}

// Example 3: Reverse Geocode Current Location
// ============================================

import { useAddressSearch } from './hooks/useAddressSearch';
import AddressDisplayComponent from './components/address/AddressDisplayComponent';

function CurrentLocationDisplay({ gpsCoordinates }) {
  const { address, isLoading, reverseGeocode } = useAddressSearch();

  useEffect(() => {
    if (gpsCoordinates?.latitude && gpsCoordinates?.longitude) {
      reverseGeocode(
        gpsCoordinates.latitude,
        gpsCoordinates.longitude
      );
    }
  }, [gpsCoordinates]);

  return (
    <div>
      <h3>Your Location</h3>
      {isLoading ? (
        <p>Finding address...</p>
      ) : address ? (
        <AddressDisplayComponent
          address={address}
          showCoordinates={true}
        />
      ) : (
        <p>No address found</p>
      )}
    </div>
  );
}

// Example 4: Full Location Setup with GPS + Address
// ==================================================

import { useGeolocation } from './hooks/useGeolocation'; // Assuming this exists
import { useAddressSearch } from './hooks/useAddressSearch';
import AddressSearchComponent from './components/address/AddressSearchComponent';
import AddressDisplayComponent from './components/address/AddressDisplayComponent';

function LocationSetup() {
  const { location, error: gpsError } = useGeolocation();
  const {
    address,
    reverseGeocode,
    reverseGeocodeFromLocation,
  } = useAddressSearch();

  // Auto-find address when location changes
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      reverseGeocode(location.latitude, location.longitude);
    }
  }, [location]);

  return (
    <div className="space-y-6">
      {/* GPS Location Status */}
      <div>
        <h3 className="font-medium mb-2">GPS Location</h3>
        {gpsError ? (
          <p className="text-red-500">{gpsError}</p>
        ) : location ? (
          <p className="text-green-600">
            ✓ GPS: {location.latitude.toFixed(4)},
            {location.longitude.toFixed(4)} (Accuracy:
            {Math.round(location.accuracy)}m)
          </p>
        ) : (
          <p>Waiting for GPS signal...</p>
        )}
      </div>

      {/* Auto-detected Address */}
      {address && (
        <div>
          <h3 className="font-medium mb-2">Detected Address</h3>
          <AddressDisplayComponent
            address={address}
            showCoordinates={true}
            allowReverseGeocode={false}
          />
        </div>
      )}

      {/* Manual Address Search */}
      <div>
        <h3 className="font-medium mb-2">Or Search Manually</h3>
        <AddressSearchComponent
          onSelect={(selectedAddress) => {
            console.log('Manually selected:', selectedAddress);
            // Update location based on selected address
          }}
          placeholder="Search for delivery address..."
        />
      </div>
    </div>
  );
}

// Example 5: Integration with Rider Tracking
// ===========================================

// In rider delivery page, show buyer's address details:

import AddressDisplayComponent from './components/address/AddressDisplayComponent';

function RiderDeliveryPage({ deliveryOrder }) {
  return (
    <div className="space-y-4">
      <h2>Delivery Details</h2>

      {/* Buyer Delivery Address */}
      {deliveryOrder.delivery_address && (
        <div>
          <h3 className="font-medium mb-2">Delivery Address</h3>
          <AddressDisplayComponent
            address={deliveryOrder.delivery_address}
            showCoordinates={true}
            editable={false}
          />
        </div>
      )}

      {/* Seller Location */}
      {deliveryOrder.pickup_address && (
        <div>
          <h3 className="font-medium mb-2">Pickup Address</h3>
          <AddressDisplayComponent
            address={deliveryOrder.pickup_address}
            showCoordinates={true}
            editable={false}
          />
        </div>
      )}
    </div>
  );
}

// API ENDPOINTS REFERENCE
// =======================

/*
Backend API endpoints are now available at:

1. ADDRESS SEARCH
   GET /api/buyer/address/search/?q=<query>&limit=<max_results>
   Response: {
     query: string,
     count: number,
     results: [
       {
         display_name: string,
         latitude: number,
         longitude: number,
         address_type: string,
         importance: number,
         address: string
       }
     ]
   }

2. REVERSE GEOCODE (GPS to Address)
   POST /api/buyer/address/reverse-geocode/
   Request: {
     latitude: number,
     longitude: number
   }
   Response: {
     success: boolean,
     address: {
       display_name: string,
       latitude: number,
       longitude: number,
       street: string,
       city: string,
       state: string,
       postcode: string,
       country: string
     }
   }

3. VALIDATE ADDRESS
   POST /api/buyer/address/validate/
   Request: {
     address: string
   }
   Response (valid): {
     valid: true,
     address: string,
     display_name: string,
     latitude: number,
     longitude: number,
     address_type: string
   }
   Response (invalid): {
     valid: false,
     message: string,
     suggestion: string
   }

CACHE BENEFITS:
- Reduces Nominatim API calls (limited to 1 req/sec)
- Caching duration: 24 hours per query
- Coordinates rounded to ~11m accuracy for cache matching
- Cache statistics visible in Django admin (buyer/Address Cache)
- Admin shows access_count for popular addresses

FEATURES IMPLEMENTED:
✅ Address search with autocomplete
✅ Reverse geocoding from GPS coordinates
✅ Address validation with importance scoring
✅ Intelligent caching layer (SHA256-based)
✅ Coordinate rounding for cache efficiency
✅ Nigeria-focused (country code: NG)
✅ Error handling with user-friendly messages
✅ React components with keyboard navigation
✅ Custom hooks for address operations
✅ Ratings/relevance scores
✅ Component-based architecture
*/

export {
  CheckoutPage,
  AddressValidationForm,
  CurrentLocationDisplay,
  LocationSetup,
  RiderDeliveryPage,
};
