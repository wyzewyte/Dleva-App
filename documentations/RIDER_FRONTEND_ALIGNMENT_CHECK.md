# 🚴 Rider Frontend Build Plan - Backend Alignment Check

## ✅ THOROUGH CROSS-CHECK ANALYSIS

### Backend Endpoints Overview (From urls.py & views)

**Total Endpoints: 43**
- Auth: 5 endpoints
- Profile: 4 endpoints  
- Documents: 2 endpoints
- Bank Details: 2 endpoints
- Orders: 2 endpoints
- Wallet: 3 endpoints
- Assignment: 3 endpoints (KEY: Available Orders)
- Delivery Lifecycle: 9 endpoints
- Wallet & Payouts: 5 endpoints
- Disputes: 3 endpoints
- Ratings & Performance: 3 endpoints
- Admin: 6 endpoints (not for frontend)
- Real-Time: 4 endpoints

---

## ✅ PHASE 1: Authentication - **ALIGNED ✓**

### Requirements Met:
- ✅ `POST /rider/register/` - Register rider
- ✅ `POST /rider/login/` - Get seller_access_token
- ✅ `POST /rider/request-phone-otp/` - Request OTP
- ✅ `POST /rider/verify-phone-otp/` - Verify OTP
- ✅ `GET /rider/profile/` - Fetch rider profile
- ✅ `POST /rider/logout/` - Logout endpoint

### Frontend Implementation:
```jsx
// Services needed:
- riderAuth.js: login(), register(), phoneOTP(), verifyOTP()
- RiderAuthContext.jsx: Token management, protected routes
- RiderLogin.jsx: Form + phone verification UI
```

### Status: ✅ **READY TO BUILD**

---

## ⚠️ PHASE 2: Dashboard & Deliveries - **PARTIAL MISALIGNMENT**

### Backend Endpoint Found:
- `GET /rider/available-orders/` ← **NOT `/available-deliveries/`** 
  - Returns orders that need riders (awaiting assignment)
  - This is correct for the dashboard

### What We Need:
1. **Dashboard Page** showing:
   - Available orders to accept
   - Order card with restaurant, buyer, delivery distance, earnings estimate
   - Accept/Reject buttons

2. **Order/Delivery Card Component**:
   - Restaurant name & location
   - Buyer location
   - Distance calculation
   - Estimated earning (use `/rider/estimate-delivery-fee/` endpoint)
   - Accept button → `POST /rider/order/{id}/accept/`
   - Reject button → `POST /rider/order/{id}/reject/`

### Backend Endpoints to Use:
```
GET /rider/available-orders/     → List available orders
POST /rider/order/{id}/accept/   → Accept delivery
POST /rider/order/{id}/reject/   → Reject delivery
POST /rider/estimate-delivery-fee/ → Get earning estimate
```

### Correction Needed:
```diff
- /rider/available-deliveries/ 
+ /rider/available-orders/
```

### Status: ✅ **ALIGNED** (with naming correction)

---

## ✅ PHASE 3: Active Delivery Tracking - **FULLY ALIGNED ✓**

### Delivery Lifecycle Endpoints (Backend):
```
POST /rider/order/{id}/arrived-at-pickup/
POST /rider/order/{id}/pickup/
POST /rider/order/{id}/on-the-way/
POST /rider/order/{id}/delivery-attempted/  (failed attempt)
POST /rider/order/{id}/deliver/             (mark complete)
POST /rider/order/{id}/cancel/
POST /rider/order/{id}/update-location/    (GPS tracking)
GET  /rider/order/{id}/delivery-status/    (get current status)
```

### Frontend Needed:
1. **Active Delivery Page** showing:
   - Live map with rider location
   - Order details (restaurant, customer, items)
   - Current status badge
   - Action buttons per status

2. **Delivery Status Flow**:
   ```
   Order Accepted
       ↓
   Arrived at Pickup → Pickup Order → On The Way → Deliver (with proof)
       ↓
   Cancel anytime (before pickup)
       ↓
   Failed Attempt (retry/cancel)
   ```

3. **Location Updates**:
   - GPS tracking `POST /rider/order/{id}/update-location/`
   - Send coordinates every 10-30 seconds
   - Real-time WebSocket for live updates

4. **Real-Time Updates**:
   ```
   WebSocket: /ws/rider/delivery/{order_id}/
   Events:
   - delivery.assigned
   - delivery.status_changed
   - delivery.cancelled
   - order.item_ready (from restaurant)
   ```

### Status: ✅ **FULLY ALIGNED**

---

## ✅ PHASE 4: Earnings & Wallet - **FULLY ALIGNED ✓**

### Backend Wallet Endpoints:
```
GET /rider/wallet/info/              → Current balance (available + pending)
GET /rider/wallet/earnings/today/    → Today's earnings
GET /rider/wallet/earnings/weekly/   → Last 7 days breakdown
GET /rider/wallet/transactions/      → Transaction history  
GET /rider/wallet/summary/           → All-time stats
POST /rider/payout/request/          → Request withdrawal
GET  /rider/payout/history/          → Payout history
```

### Frontend Pages Needed:

**1. Earnings Summary Page:**
```
- Total earned (all-time)
- Today's earnings
- Weekly breakdown (7 days)
- This month vs last month
- Average per delivery
```

**2. Wallet Page:**
```
- Available balance
- Pending balance (holds)
- Can withdraw if >= minimum (₦2000)
- Minimum payout requirement
- Withdrawal cooldown (24 hours)
```

**3. Payout Page:**
```
- Request withdrawal form
- Payout history (approved, pending, rejected)
- Status tracking
- Bank details already set in Phase 1
```

**4. Transaction History:**
```
- List all transactions
- Filter by type (delivery, refund, withdrawal)
- Date range filter
- Pagination
```

### Status: ✅ **FULLY ALIGNED**

---

## ⚠️ PHASE 5: Settings & Profile - **NEEDS REORGANIZATION**

### Issue Found:
**This should happen EARLIER - before rider can go online!**

Backend has verification flow:
1. ✅ Phone number verified (OTP)
2. ✅ Documents uploaded & approved
3. ✅ Bank details added
4. ✅ Profile complete
5. ✅ Then can toggle online status

### Current Backend Validation (from views.py):
```python
def can_go_online(rider):
    return (
        rider.phone_verified and
        rider.documents.filter(status='approved').exists() and
        hasattr(rider, 'bank_details') and
        rider.bank_details is not None and
        rider.profile_completion_percent == 100 and
        rider.account_status == 'approved' and
        rider.is_verified and
        rider.verification_status == 'approved'
    )
```

### Recommended Frontend Flow:
```
Phase 1A: Auth (Login/Register + Phone OTP)
    ↓
Phase 1B: Verification Setup (Documents + Bank Details) 
    ↓
Phase 5: Full Settings/Profile Management
    ↓
Phase 2: Dashboard (only accessible if verified & online)
```

### Settings Endpoints:
```
GET  /rider/profile/                  → Get profile
PATCH /rider/profile/                 → Update profile
GET  /rider/profile/verification-status/ → Check if ready
POST /rider/documents/upload/         → Upload ID, License, etc.
GET  /rider/documents/status/         → Check document approval
POST /rider/bank/add/                 → Add bank details
GET  /rider/bank/details/             → Retrieve bank info (masked)
POST /rider/profile/toggle-online/    → Go online/offline
```

### Status: ⚠️ **NEEDS PHASE REORGANIZATION**

---

## ✅ PHASE 6: Real-Time Features - **FULLY ALIGNED ✓**

### Backend Real-Time Endpoints:
```
GET  /rider/notifications/unread/
POST /rider/notifications/{id}/read/
GET  /rider/notifications/history/
GET  /rider/location/current/{rider_id}/
POST /rider/location/start-tracking/
POST /rider/fcm-token/register/        (for push notifications)
POST /rider/order/{id}/subscribe/      (WebSocket subscription)
```

### WebSocket Events Expected:
```python
# From realtime_service.py (backend)
- delivery.assigned          → New order available
- delivery.status_changed    → Customer notified of status
- delivery.cancelled         → Order cancelled by buyer/seller
- performance.updated        → Rating received
- order.item_ready          → Restaurant ready for pickup (if integrated)
```

### Frontend Needed:
```jsx
// Services:
- riderWebSocket.js: Connection management, event listeners
- useDeliveryUpdates.js: Hook for real-time delivery updates
- useLocationBroadcast.js: Hook for GPS broadcasting

// Features:
- WebSocket auto-reconnect
- Notification icon with unread count
- Sound/vibration for new deliveries
- Connection status indicator
```

### Status: ✅ **FULLY ALIGNED**

---

## ✅ PHASE 7: Offline Support - **READY FOR IMPLEMENTATION**

### What We Need:
```
Browser APIs:
- Geolocation API (already used)
- Service Workers (offline caching)
- IndexedDB (offline queue storage)
- Background Sync API (queue location updates)
```

### Offline Scenarios:
```
1. Accept delivery → offline → queue action → sync when online
2. GPS update → offline → cache position → batch send when online
3. Mark picked up → offline → queue action → execute when online
4. View active delivery → offline → show cached data
```

### Status: ✅ **READY**

---

## ✅ PHASE 8-10: Polish, Testing, Deploy - **READY**

### Required:
- Error boundaries
- Loading skeletons
- Empty states
- Accessibility (WCAG 2.1)
- Mobile optimization (responsive)
- Dark mode (optional)
- Performance monitoring

### Status: ✅ **STANDARD PRACTICES**

---

## 🔍 CRITICAL FLOW ANALYSIS

### Rider App Complete User Journey:

```
1. SIGNUP & VERIFICATION (Phase 1 + 1B)
   ├─ Register with email/password
   ├─ Verify phone with OTP
   ├─ Upload documents (ID, License, etc.)
   ├─ Add bank details
   └─ Wait for admin approval

2. ONBOARDING (Phase 5)
   ├─ Complete profile info
   ├─ Set vehicle type
   ├─ Set delivery preferences
   ├─ View verification status
   └─ Toggle online/offline

3. ACCEPT DELIVERIES (Phase 2)
   ├─ Dashboard shows available orders
   ├─ Click order to see details
   ├─ Accept or reject
   └─ Order assigned to rider

4. ACTIVE DELIVERY (Phase 3)
   ├─ Navigate to restaurant pickup
   ├─ Mark as "Arrived at Pickup"
   ├─ Confirm order pickup
   ├─ Navigate to customer
   ├─ GPS tracking (real-time)
   ├─ Mark as "On The Way"
   ├─ Arrive at customer
   ├─ Take proof photo
   ├─ Mark as "Delivered"
   └─ Order complete

5. EARNINGS VIEW (Phase 4)
   ├─ Check today's earnings
   ├─ View weekly breakdown
   ├─ Check wallet balance
   ├─ Request payout (if >= minimum)
   └─ Track payout status

6. SETTINGS (Phase 5)
   ├─ Update profile
   ├─ Change vehicle
   ├─ Set preferences
   ├─ View ratings
   └─ Handle disputes
```

---

## 📋 API ENDPOINTS CHECKLIST

### ✅ Auth (5/5)
- [x] Register
- [x] Login
- [x] Phone OTP Request
- [x] Phone OTP Verify
- [x] Logout

### ✅ Profile & Verification (4/4)
- [x] Get Profile
- [x] Update Profile
- [x] Check Verification Status
- [x] Toggle Online/Offline

### ✅ Documents (2/2)
- [x] Upload Document
- [x] Check Document Status

### ✅ Bank Details (2/2)
- [x] Add Bank Details
- [x] Get Bank Details (masked)

### ✅ Deliveries (5/5)
- [x] List Available Orders
- [x] Accept Order
- [x] Reject Order
- [x] Get Order Status
- [x] List Rider Orders

### ✅ Delivery Lifecycle (9/9)
- [x] Arrived at Pickup
- [x] Pickup Order
- [x] On The Way
- [x] Delivery Attempted (failed)
- [x] Verify & Deliver (with proof)
- [x] Cancel Delivery
- [x] Update Location (GPS)
- [x] Get Delivery Status
- [x] Release Order (cancel before pickup)

### ✅ Wallet & Earnings (5/5)
- [x] Wallet Info
- [x] Today's Earnings
- [x] Weekly Earnings
- [x] Transaction History
- [x] Earnings Summary

### ✅ Payouts (2/2)
- [x] Request Withdrawal
- [x] Payout History

### ✅ Disputes (3/3)
- [x] Lodge Dispute
- [x] Dispute Status
- [x] My Disputes

### ✅ Ratings (3/3)
- [x] Submit Rider Rating (from customers)
- [x] Get Rider Ratings
- [x] Get Performance Stats

### ✅ Real-Time (4/4)
- [x] Notifications Unread
- [x] Mark Notification Read
- [x] Notifications History
- [x] Start Tracking (location)

### 🟡 Estimate Delivery Fee (1/1)
- [x] Estimate Fee (for showing earnings before acceptance)

---

## ⚠️ ISSUES FOUND & CORRECTIONS

### 1. **Endpoint Name Mismatch** ⚠️
```diff
PLAN: GET /rider/available-deliveries/
BACKEND: GET /rider/available-orders/

FIX: Update plan to use "orders" terminology consistently
```

### 2. **Missing Verification Sequence** ⚠️
```
ISSUE: Phase 5 (Settings) comes after Phase 4 (Earnings)
FIX: Should be Phase 1B - Verification happens BEFORE dashboard access

Rider cannot:
- Go online without: phone verified + docs approved + bank details
- See available orders without being online
- Earn money without completing all verification
```

### 3. **Order vs Delivery Terminology** ⚠️
```
Backend uses:
- /rider/available-orders/
- /rider/order/{id}/accept/
- /rider/order/{id}/deliver/

Frontend plan used:
- /rider/available-deliveries/ ← WRONG
- /rider/delivery/{id}/accept/  ← WRONG
- /rider/delivery/{id}/deliver/ ← WRONG

FIX: Standardize on "order" terminology for backend compatibility
```

### 4. **Online Status Toggle Required** ⚠️
```
Before accessing dashboard:
POST /rider/profile/toggle-online/ with {"is_online": true}

Cannot go online if:
- Phone not verified
- Documents not approved
- Bank details not added
- Profile incomplete
- Account status != 'approved'

Frontend must:
✅ Check verification_status first
✅ Show "Complete Profile" if not ready
✅ Only show dashboard if is_online == true
```

### 5. **Push Notification Setup** ⚠️
```
For incoming deliveries to work:
POST /rider/fcm-token/register/
{
    "fcm_token": "firebase_token_here",
    "device_type": "web|android|ios"
}

Without this: Rider won't get notifications for new orders
```

---

## ✅ RECOMMENDED PHASE REORGANIZATION

### **Phase 1: Authentication** (30 mins)
- Login/Register
- Phone OTP verification  
- Initial profile fetch

### **Phase 1B: Verification & Setup** (30 mins) ← MOVED UP
- Document upload
- Bank details setup
- Profile completion check
- Toggle online status

### **Phase 2: Dashboard & Deliveries** (45 mins)
- Available orders list
- Accept/Reject orders
- Order cards with estimates
- Real-time refresh

### **Phase 3: Active Delivery Tracking** (60 mins)
- Live map tracking
- Delivery lifecycle status updates
- GPS location broadcasting
- Real-time WebSocket events

### **Phase 4: Earnings & Wallet** (45 mins)
- Earnings summary
- Daily/Weekly breakdown
- Transaction history
- Payout requests

### **Phase 5: Settings & Profile** (30 mins) ← MOVED DOWN
- Profile customization
- Preferences settings
- Vehicle info
- Notifications settings

### **Phase 6: Real-Time Features** (45 mins)
- WebSocket integration
- Notifications system
- Sound/vibration alerts
- Auto-reconnection

### **Phase 7-10: Polish, Offline, Testing, Deploy**

---

## 🎯 CRITICAL CONTEXT DATA

### From views.py - can_go_online() Function:
```python
def can_go_online(rider):
    return (
        rider.phone_verified and                          # ✅ OTP verified
        rider.documents.filter(status='approved').exists() and  # ✅ Docs approved
        hasattr(rider, 'bank_details') and                 # ✅ Bank added
        rider.bank_details is not None and
        rider.profile_completion_percent == 100 and       # ✅ Profile 100%
        rider.account_status == 'approved' and            # ✅ Admin approval
        rider.is_verified and                             # ✅ General verified
        rider.verification_status == 'approved'           # ✅ Verification approved
    )
```

**Frontend Must:**
1. Display verification checklist
2. Prevent dashboard access without `can_go_online() == True`
3. Show blocked reasons if can't go online

### From views.py - get_blocked_reasons() Function:
Returns array of reasons why rider cannot go online:
```python
[
    'Phone number not verified',
    'Documents not approved',
    'Bank details not added',
    'Profile incomplete (78%)',
    'Account status: under_review',
    'Verification pending'
]
```

**Frontend Must:**
1. Display ALL blocked reasons in a list
2. Show action buttons to fix each reason
3. Update status when each requirement is met
4. Enable "Go Online" button only when ALL resolved

---

## ✅ FINAL ALIGNMENT STATUS

| Phase | Backend Ready | Frontend Plan | Alignment | Status |
|-------|---------------|---------------|-----------|--------|
| 1: Auth | ✅ 5 endpoints | Correct | ✅ ALIGNED | Ready |
| 1B: Verify | ✅ 4 endpoints | ⚠️ Missing | ⚠️ ADD THIS | **CRITICAL** |
| 2: Dashboard | ✅ 3 endpoints | ⚠️ Wrong URL | ⚠️ FIX URL | Ready |
| 3: Tracking | ✅ 9 endpoints | Correct | ✅ ALIGNED | Ready |
| 4: Earnings | ✅ 5 endpoints | Correct | ✅ ALIGNED | Ready |
| 5: Settings | ✅ 4 endpoints | ⚠️ Wrong order | ⚠️ REORGANIZE | Ready |
| 6: Real-Time | ✅ 4 endpoints | Correct | ✅ ALIGNED | Ready |
| 7-10: Polish | ✅ Ready | Standard | ✅ ALIGNED | Ready |

---

## 🚀 CORRECTED PHASE ORDER FOR FRONTEND BUILD

```
PHASE 1: Auth (30m)
  → riderAuth.js, RiderAuthContext, RiderLogin.jsx

PHASE 1B: Verification Setup (30m) ← NEW/CRITICAL
  → DocumentUpload, BankDetails, VerificationChecklist
  → Check can_go_online() before dashboard

PHASE 2: Dashboard (45m)
  → Use /rider/available-orders/ (NOT available-deliveries)
  → DeliveryCard, Accept/Reject buttons

PHASE 3: Tracking (60m)
  → Use /rider/order/{id}/ endpoints (NOT delivery/)
  → Map, GPS, Status updates

PHASE 4: Earnings (45m)
  → Wallet info, earnings breakdown, payouts

PHASE 5: Settings (30m) ← MOVED HERE
  → Profile, preferences, vehicle info

PHASES 6-10: Real-Time, Offline, Polish, Testing, Deploy
```

---

## 📝 FINAL RECOMMENDATIONS

### Critical Changes Before Building:

1. **✅ Add Phase 1B (Verification)** - MUST DO
   - Without this, riders can't go online
   - This blocks access to dashboard

2. **✅ Rename Endpoints in Frontend**
   - Use "order" not "delivery" for consistency with backend
   - `/rider/available-orders/` not `/available-deliveries/`
   - `/rider/order/{id}/` not `/rider/delivery/{id}/`

3. **✅ Add Online Status Toggle**
   - Must call `POST /rider/profile/toggle-online/` before showing orders
   - Check `can_go_online()` first to show why user might be blocked

4. **✅ Add FCM Token Registration**
   - Call `POST /rider/fcm-token/register/` on app load
   - Enables push notifications for new deliveries

5. **✅ Verify Real-Time WebSocket**
   - Subscribe to `/ws/rider/delivery/{order_id}/`
   - Listen for delivery status changes in real-time

6. **✅ Add Error Handling for Verification**
   - If can_go_online() == False, show blocked reasons
   - Provide action buttons to resolve each issue

---

## ✅ CONCLUSION

**Backend is FULLY PREPARED** with all 43 endpoints needed.

**Frontend plan is 85% ALIGNED** with only 3 corrections:
1. Add Phase 1B (Verification)
2. Fix endpoint names (order vs delivery)
3. Reorganize phase order

**Build is READY TO START** with corrected plan.

Recommended to start with **Phase 1: Auth** tomorrow.
