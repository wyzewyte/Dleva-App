# Refactoring Quick Reference Guide

## 📋 At a Glance

This quick reference shows the most common patterns for using the new centralized utilities and constants.

---

## 🎯 Most Common Use Cases

### 1. Format Currency (₦ Price Display)

```javascript
import { formatCurrency } from '../../../utils/formatters';

// In JSX:
<div>Price: {formatCurrency(1500)}</div>
// Output: Price: ₦1,500

<div>Tax: {formatCurrency(150.5)}</div>
// Output: Tax: ₦150.50
```

### 2. Get Status Label (Order Status with Color)

```javascript
import { getStatusLabel, getStatusColor } from '../../../constants/statusLabels';

const status = getStatusLabel('pending');
<div style={{ color: status.color }}>
  {status.label}
</div>
// Output: <div style={{ color: '#FF9900' }}>Pending</div>

// Or just get the color:
const color = getStatusColor('delivered');
// Returns: '#00C853'
```

### 3. Validate Email Field

```javascript
import { validateEmail } from '../../../utils/validators';

const handleEmailChange = (email) => {
  const result = validateEmail(email);
  if (!result.isValid) {
    setEmailError(result.error);  // "Please enter a valid email address"
  } else {
    setEmailError(null);
  }
};
```

### 4. Calculate Delivery Fee

```javascript
import { calculateDeliveryFee, getFeeBreakdown } from '../../../constants/deliveryFeeTiers';

const distance = 5.5;
const fee = calculateDeliveryFee(distance);
// Returns: 550

const breakdown = getFeeBreakdown(distance);
console.log(breakdown.riderEarning);        // 330 (60% of fee)
console.log(breakdown.platformCommission);  // 220 (40% of fee)
```

### 5. Handle API Error

```javascript
import { getErrorMessage, logError } from '../../../utils/errorHandler';

try {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    logError(error, { endpoint: url });
    setError(getErrorMessage(error));
  }
} catch (error) {
  logError(error, { context: 'fetchOrderData' });
  setError('Something went wrong. Please try again.');
}
```

### 6. Show User Message

```javascript
import { getMessage } from '../../../constants/messages';

const handleOrderPlace = () => {
  alert(getMessage('SUCCESS.ORDER_PLACED'));
  // Output: "Your order has been placed successfully!"
};

const handleInvalidEmail = () => {
  setError(getMessage('VALIDATION.INVALID_EMAIL'));
  // Output: "Please enter a valid email address"
};
```

---

## 📁 File Location Imports

### Depending on your location, adjust the import path:

**From `src/modules/buyer/pages/Cart.jsx`:**
```javascript
import { formatCurrency } from '../../../utils/formatters';
import { getMessage } from '../../../constants/messages';
```

**From `src/components/OrderCard.jsx`:**
```javascript
import { getStatusLabel } from '../../constants/statusLabels';
import { formatCurrency } from '../../utils/formatters';
```

**From `src/services/deliveryService.js`:**
```javascript
import { calculateDistance } from '../utils/distanceCalculator';
import { calculateDeliveryFee } from '../constants/deliveryFeeTiers';
import { getAPIUrl, API_ENDPOINTS } from '../constants/apiConfig';
```

---

## 🚀 Formatting Functions Quick Reference

```javascript
import { formatCurrency, formatDate, formatDistance, formatDuration, 
         formatPhoneNumber, formatRating, formatPercent } from '../utils/formatters';

// Currency
formatCurrency(1500)                    // "₦1,500"
formatCurrency(150.5)                   // "₦150.50"

// Date
formatDate(new Date())                  // "27 Feb, 2026"
formatDate(new Date(), 'DD/MM/YYYY')    // "27/02/2026"

// Distance
formatDistance(5.5)                     // "5.5 km"
formatDistance(0.3)                     // "0.3 km"

// Duration
formatDuration(25)                      // "25 mins"
formatDuration(70)                      // "1h 10m"

// Phone Number
formatPhoneNumber('07031234567')        // "703 123 4567"

// Rating
formatRating(4.5)                       // "⭐⭐⭐⭐☆ (4.5)"

// Percent
formatPercent(0.75)                     // "75%"
formatPercent(0.6666, 2)                // "66.67%"
```

---

## ✅ Validation Functions Quick Reference

```javascript
import { validateEmail, validatePhoneNumber, validatePassword,
         validateRequired, validateNumeric, validateAmount } from '../utils/validators';

// All return: { isValid: boolean, error: string | null }

// Email
validateEmail('test@example.com')           // { isValid: true, error: null }
validateEmail('invalid')                    // { isValid: false, error: "..." }

// Phone
validatePhoneNumber('07031234567')          // { isValid: true, error: null }
validatePhoneNumber('123')                  // { isValid: false, error: "..." }

// Password
validatePassword('Pass123!')                // { isValid: true, error: null }
validatePassword('weak')                    // { isValid: false, error: "..." }

// Required
validateRequired('value')                   // { isValid: true, error: null }
validateRequired('')                        // { isValid: false, error: "..." }

// Numeric
validateNumeric('123.45')                   // { isValid: true, error: null }
validateNumeric('abc')                      // { isValid: false, error: "..." }

// Amount
validateAmount('1500', 100, 50000)          // Check if between min/max
```

---

## 📊 All Status Options

```javascript
import { getStatusLabel, ORDER_STATUSES } from '../constants/statusLabels';

// All available statuses:
const statuses = [
  'pending',              // Order waiting for confirmation
  'confirming',           // Restaurant confirming
  'confirmed',            // Order confirmed
  'preparing',            // Food being prepared
  'ready',                // Ready for delivery
  'arrived_at_pickup',    // Rider at restaurant
  'picked_up',            // Order picked up
  'on_the_way',           // In delivery
  'delivered',            // Successfully delivered
  'delivery_attempted',   // Delivery attempt failed
  'cancelled'             // Order cancelled
];

// Get full status object:
const status = getStatusLabel('pending');
// {
//   label: 'Pending',
//   color: '#FF9900',
//   bgColor: '#FFF3E0',
//   icon: 'clock',
//   description: 'Order waiting for restaurant confirmation'
// }
```

---

## 🌍 All Message Categories

```javascript
import { getMessage } from '../constants/messages';

// SUCCESS
getMessage('SUCCESS.ORDER_PLACED')
getMessage('SUCCESS.PAYMENT_CONFIRMED')
getMessage('SUCCESS.PROFILE_UPDATED')

// ERROR
getMessage('ERROR.NETWORK_ERROR')
getMessage('ERROR.INVALID_EMAIL')
getMessage('ERROR.PAYMENT_FAILED')

// VALIDATION
getMessage('VALIDATION.REQUIRED_FIELD')
getMessage('VALIDATION.INVALID_AMOUNT')

// STATUS
getMessage('STATUS.PREPARING')
getMessage('STATUS.ON_THE_WAY')

// INFO
getMessage('INFO.CALCULATING')
getMessage('INFO.LOADING')

// CONFIRM
getMessage('CONFIRM.CANCEL_ORDER')
getMessage('CONFIRM.DELETE_ADDRESS')
```

---

## 🔧 API Endpoint Usage

```javascript
import { getAPIUrl, API_ENDPOINTS } from '../constants/apiConfig';

// Login
fetch(getAPIUrl(API_ENDPOINTS.AUTH.LOGIN), {
  method: 'POST',
  body: JSON.stringify(credentials)
});

// Get Rider Profile
fetch(getAPIUrl(API_ENDPOINTS.RIDER.PROFILE));

// Estimate Delivery Fee
fetch(getAPIUrl(API_ENDPOINTS.DELIVERY.ESTIMATE_FEE), {
  method: 'POST',
  body: JSON.stringify({ pickup: {...}, delivery: {...} })
});

// List Restaurants
fetch(getAPIUrl(API_ENDPOINTS.RESTAURANTS.LIST) + `?lat=6.5&lon=3.3`);
```

---

## 💰 Delivery Fee Calculation

```javascript
import { calculateDeliveryFee, getFeeBreakdown, PAYOUT_CONFIG } from '../constants/deliveryFeeTiers';

// Simple fee calculation
const distance = 5.5; // km
const fee = calculateDeliveryFee(distance);
// Returns: 550 (₦)

// Complete breakdown
const breakdown = getFeeBreakdown(5.5);
// Returns: {
//   distance: 5.5,
//   baseFee: 500,
//   distanceFee: 50,
//   totalFee: 550,
//   riderEarning: 330,
//   platformCommission: 220
// }

// Payout config
console.log(PAYOUT_CONFIG.RIDER_SHARE);           // 0.60 (60%)
console.log(PAYOUT_CONFIG.PLATFORM_SHARE);        // 0.40 (40%)
console.log(PAYOUT_CONFIG.MIN_RIDER_PAYOUT);      // 200 (₦200)
console.log(PAYOUT_CONFIG.SERVICE_RADIUS_KM);     // 20 km

// Fee tiers
const distance1 = 2.5;   // ≤ 3 km: ₦500
const fee1 = calculateDeliveryFee(distance1);     // 500

const distance2 = 5.5;   // 3-6 km: ₦600 + extra
const fee2 = calculateDeliveryFee(distance2);     // 650

const distance3 = 15;    // > 6 km: ₦1000 + extra
const fee3 = calculateDeliveryFee(distance3);     // 2350
```

---

## 📍 Distance Calculation

```javascript
import { calculateDistance, estimateDeliveryTime, isWithinServiceArea } from '../utils/distanceCalculator';

// Calculate distance between two coordinates (Haversine formula)
const distance = calculateDistance(6.5264, 3.3792, 6.5521, 3.3674);
// Returns: 3.2 (km)

// Estimate delivery time based on distance
const timeMinutes = estimateDeliveryTime(3.2);
// Returns: 20 minutes

// Check if within service area (≤ 20 km)
const isServiced = isWithinServiceArea(25);
// Returns: false

// Service area boundary
if (isWithinServiceArea(distance)) {
  console.log('Can deliver to this location');
} else {
  console.log('Outside service area');
}
```

---

## 🔴 Error Handling Examples

```javascript
import { parseError, getErrorMessage, logError, retryWithBackoff } from '../utils/errorHandler';

// Basic error handling
try {
  await fetchData();
} catch (error) {
  const parsed = parseError(error);
  logError(parsed, { context: 'fetchData' });
  console.error(getErrorMessage(parsed));
}

// With retry
const data = await retryWithBackoff(
  () => fetch(url).then(r => r.json()),
  3  // max 3 retries
);

// Validation errors from API
try {
  const response = await fetch(url, { method: 'POST', body: JSON.stringify(data) });
  if (!response.ok) {
    const body = await response.json();
    const errors = handleValidationErrors(body.errors);
    // Returns: { fieldName: 'error message', ... }
  }
} catch (error) {
  logError(error, { endpoint: url });
}
```

---

## 📋 Common Patterns

### Pattern: Display Price with Fallback
```javascript
import { formatCurrency } from '../utils/formatters';

<span>{price ? formatCurrency(price) : 'Price TBA'}</span>
```

### Pattern: Status Badge with Color
```javascript
import { getStatusLabel } from '../constants/statusLabels';

const status = getStatusLabel('delivered');
<span 
  style={{ 
    backgroundColor: status.bgColor, 
    color: status.color,
    padding: '4px 8px',
    borderRadius: '4px'
  }}
>
  {status.label}
</span>
```

### Pattern: Form Input with Validation
```javascript
import { validateEmail } from '../utils/validators';

const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleEmailChange = (e) => {
  const value = e.target.value;
  setEmail(value);
  
  const result = validateEmail(value);
  setError(result.isValid ? '' : result.error);
};

<div>
  <input value={email} onChange={handleEmailChange} />
  {error && <span style={{ color: 'red' }}>{error}</span>}
</div>
```

### Pattern: API Call with Error Handling
```javascript
import { getAPIUrl, API_ENDPOINTS } from '../constants/apiConfig';
import { getErrorMessage, logError } from '../utils/errorHandler';

const fetchRiderProfile = async () => {
  try {
    const response = await fetch(getAPIUrl(API_ENDPOINTS.RIDER.PROFILE));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    logError(error, { endpoint: 'RIDER.PROFILE' });
    throw new Error(getErrorMessage(error));
  }
};
```

### Pattern: Fee Calculation and Display
```javascript
import { calculateDeliveryFee, getFeeBreakdown } from '../constants/deliveryFeeTiers';
import { formatCurrency } from '../utils/formatters';

const distance = 5.5;
const breakdown = getFeeBreakdown(distance);

<div>
  <p>Delivery Fee: {formatCurrency(breakdown.totalFee)}</p>
  <p>Rider Earning: {formatCurrency(breakdown.riderEarning)}</p>
  <p>Platform Commission: {formatCurrency(breakdown.platformCommission)}</p>
</div>
```

---

## 🎓 Learning Path

1. **Start with formatters** - Most common, easiest to understand
2. **Then validators** - Used in all forms
3. **Then statusLabels** - For displaying order statuses
4. **Then messages** - For consistent user communication
5. **Then errorHandler** - For centralized error management
6. **Finally advanced ones** - Distance, fees, API config

---

## ✅ Checklist for Using New Utilities

- [ ] Install/import the utility from correct path
- [ ] Check JSDoc comments for parameters
- [ ] Look at example usage in updated files (Cart.jsx, Checkout.jsx)
- [ ] Test in browser DevTools before committing
- [ ] No hardcoded values - always use utilities
- [ ] Consistent formatting across entire app
- [ ] Build passes without errors

---

## 🆘 Troubleshooting

**Issue**: Import says "not found"
```javascript
// Wrong path
import { formatCurrency } from '../formatters';

// Correct path (count the ../)
import { formatCurrency } from '../../../utils/formatters';
```

**Issue**: Function returns unexpected value
```javascript
// Check the return type in JSDoc
// Most validators return: { isValid: boolean, error: string | null }
const result = validateEmail(email);
if (result.isValid) { /* ok */ }
```

**Issue**: Missing icon or color
```javascript
// statusLabels provides multiple options
const status = getStatusLabel('pending');
status.color       // Use this for text color
status.bgColor     // Use this for background
status.icon        // Use this for icon name
status.label       // Use this for display text
```

---

**Remember**: The utilities are already created and working. Just import and use them! 🚀
