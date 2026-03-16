# Phase 4: Delivery Lifecycle Testing Guide

## Overview
Phase 4 implements the complete delivery state machine with 9 endpoints handling the lifecycle from rider pickup to final delivery with wallet crediting.

## State Machine Flow

```
assigned
    ↓ (rider arrives)
arrived_at_pickup
    ↓ (seller verifies code)
released_by_seller
    ↓ (rider picks up)
picked_up
    ↓ (rider starts delivery)
on_the_way
    ├→ (delivery_attempted - if customer unreachable)
    │   ├→ (retry up to 3 times)
    │   └→ delivered (with PIN)
    └→ (deliver - direct with PIN)
```

## Endpoints

### 1. Rider Arrives at Pickup
**URL:** `POST /api/rider/order/{order_id}/arrived-at-pickup/`  
**Auth:** Rider (JWT)  
**Body:** (empty)  
**Success (200):**
```json
{
  "status": "success",
  "message": "Arrived at pickup location",
  "order_id": 123,
  "arrived_at": "2024-01-15T10:30:45.123456Z",
  "pickup_code": "ABC123"
}
```
**Error (400):**
- "Order has no assigned rider"
- "Rider not assigned to this order"
- "Rider must be online"
- "Invalid transition: {current} → arrived_at_pickup"

### 2. Seller Releases Order
**URL:** `POST /api/rider/order/{order_id}/release/`  
**Auth:** Seller (JWT)  
**Body:**
```json
{
  "pickup_code": "ABC123"
}
```
**Success (200):**
```json
{
  "status": "success",
  "message": "Order released - rider can now pickup",
  "order_id": 123,
  "released_at": "2024-01-15T10:32:15.123456Z",
  "delivery_pin": "1234"
}
```
**Error (400):**
- "Invalid pickup code"
- "Invalid transition: {current} → released_by_seller"

### 3. Rider Picks Up Order
**URL:** `POST /api/rider/order/{order_id}/pickup/`  
**Auth:** Rider (JWT)  
**Body:** (empty)  
**Success (200):**
```json
{
  "status": "success",
  "message": "Order picked up - heading to customer",
  "order_id": 123,
  "picked_up_at": "2024-01-15T10:35:20.123456Z",
  "destination": {
    "address": "123 Main St, Lagos",
    "latitude": 6.5244,
    "longitude": 3.3792
  }
}
```
**Error (400):**
- "Order not yet released by seller"
- "Rider must be online"
- "Rider not assigned to this order"

### 4. Rider On The Way
**URL:** `POST /api/rider/order/{order_id}/on-the-way/`  
**Auth:** Rider (JWT)  
**Body:** (empty)  
**Success (200):**
```json
{
  "status": "success",
  "message": "Heading to customer - ETA in progress",
  "order_id": 123,
  "status_updated_at": "2024-01-15T10:36:00.123456Z"
}
```

### 5. Delivery Attempt (Customer Unreachable)
**URL:** `POST /api/rider/order/{order_id}/delivery-attempted/`  
**Auth:** Rider (JWT)  
**Body:**
```json
{
  "reason": "Customer not answering phone"
}
```
**Success (200):**
```json
{
  "status": "success",
  "message": "Delivery attempt 1/3 recorded",
  "order_id": 123,
  "attempt_number": 1,
  "reason": "Customer not answering phone",
  "attempted_at": "2024-01-15T10:40:15.123456Z",
  "recommended_backoff_seconds": 60,
  "next_attempt_available_at": "2024-01-15T10:41:15.123456Z"
}
```
**Rules:**
- Max 3 attempts before cancellation
- Each attempt increments backoff: 1min, 2min, 3min
- Rider can retry or deliver (if customer calls back)

### 6. Verify and Deliver (Final Delivery)
**URL:** `POST /api/rider/order/{order_id}/deliver/`  
**Auth:** Rider (JWT)  
**Body:**
```json
{
  "delivery_pin": "1234",
  "proof_photo_url": "https://..."
}
```
**Success (200):**
```json
{
  "status": "success",
  "message": "Delivery completed - earning credited to wallet",
  "order_id": 123,
  "delivered_at": "2024-01-15T10:42:30.123456Z",
  "rider_earning": "450.00",
  "wallet_balance": "5450.00",
  "total_deliveries": 42
}
```
**Error (400):**
- "Invalid delivery PIN"
- "Invalid transition: {current} → delivered"

**CRITICAL: This endpoint automatically:**
- Transfers rider_earning to wallet.balance
- Creates RiderTransaction record
- Increments rider.total_deliveries
- Updates last_delivery date

### 7. Update Rider Location
**URL:** `POST /api/rider/order/{order_id}/update-location/`  
**Auth:** Rider (JWT)  
**Body:**
```json
{
  "latitude": 6.5244,
  "longitude": 3.3792
}
```
**Success (200):**
```json
{
  "status": "success",
  "message": "Location updated",
  "order_id": 123,
  "latitude": 6.5244,
  "longitude": 3.3792,
  "updated_at": "2024-01-15T10:42:20.123456Z"
}
```
**Rules:**
- Only callable during delivery (picked_up, on_the_way, delivery_attempted)
- Should be called every 20-30 seconds
- Used for real-time tracking

### 8. Cancel Delivery
**URL:** `POST /api/rider/order/{order_id>/cancel/`  
**Auth:** Rider, Seller, or Admin  
**Body:**
```json
{
  "user_type": "rider",
  "reason": "Customer cancelled"
}
```
**Success (200):**
```json
{
  "status": "success",
  "message": "Delivery cancelled",
  "order_id": 123,
  "previous_status": "on_the_way",
  "cancelled_by": "rider",
  "reason": "Customer cancelled",
  "cancelled_at": "2024-01-15T10:45:00.123456Z"
}
```
**Permissions:**
- **Seller:** Can only cancel before rider picks up (assigned → released_by_seller)
- **Rider:** Can cancel anytime after assignment (loses eligibility point)
- **Admin:** Can always cancel

### 9. Get Delivery Status
**URL:** `GET /api/rider/order/{order_id}/delivery-status/`  
**Auth:** Authenticated user  
**Success (200):**
```json
{
  "order_id": 123,
  "current_status": "on_the_way",
  "rider": {
    "id": 5,
    "name": "John Doe"
  },
  "timeline": {
    "assigned_at": "2024-01-15T10:25:00.123456Z",
    "arrived_at_pickup": "2024-01-15T10:30:45.123456Z",
    "released_at": "2024-01-15T10:32:15.123456Z",
    "picked_up_at": "2024-01-15T10:35:20.123456Z",
    "delivery_attempted_at": null,
    "delivered_at": null
  },
  "restaurant": {
    "name": "Pizza Palace"
  },
  "customer": {
    "phone": "08012345678",
    "address": "123 Main St, Lagos"
  },
  "earning": "450.00"
}
```

## Testing Workflow

### Setup
1. Create test order in 'assigned' status (assign rider via Phase 3 endpoint)
2. Get order details: `GET /api/buyer/order/{order_id}/`
3. Note: `pickup_code` and `delivery_pin` from response

### Test Sequence

#### Step 1: Rider Arrives
```bash
POST /api/rider/order/123/arrived-at-pickup/
Auth: Rider JWT
```
Expected: Status changes to `arrived_at_pickup`

#### Step 2: Seller Releases
```bash
POST /api/rider/order/123/release/
Auth: Seller JWT
Body: { "pickup_code": "ABC123" }
```
Expected: Status changes to `released_by_seller`

#### Step 3: Rider Picks Up
```bash
POST /api/rider/order/123/pickup/
Auth: Rider JWT
```
Expected: Status changes to `picked_up`

#### Step 4: Rider On The Way
```bash
POST /api/rider/order/123/on-the-way/
Auth: Rider JWT
```
Expected: Status changes to `on_the_way`

#### Step 5a: Direct Delivery
```bash
POST /api/rider/order/123/deliver/
Auth: Rider JWT
Body: { "delivery_pin": "1234" }
```
Expected: 
- Status changes to `delivered`
- Rider earning credited to wallet
- `total_deliveries` incremented

#### Step 5b: Delivery with Attempts
```bash
# First attempt
POST /api/rider/order/123/delivery-attempted/
Auth: Rider JWT
Body: { "reason": "Customer not answering" }

# Wait recommended_backoff_seconds

# Retry delivery
POST /api/rider/order/123/deliver/
Auth: Rider JWT
Body: { "delivery_pin": "1234" }
```

## Performance Notes

1. **Wallet Crediting**: Happens atomically in `verify_and_deliver()`
   - No race conditions (select_for_update)
   - Transaction created for audit trail

2. **State Machine Validation**: Prevents fraud
   - No skipping steps (must follow exact sequence)
   - No backward transitions

3. **Delivery Attempts**: Smart backoff
   - 1st attempt failing: wait 60s
   - 2nd attempt failing: wait 120s
   - 3rd attempt failing: must cancel (can't retry)

## Error Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Invalid state/input | Invalid PIN, wrong status, missing fields |
| 403 | Permission denied | Wrong user type, not assigned rider |
| 404 | Not found | Order doesn't exist |
| 500 | Server error | Database connection, unexpected exception |

## Database Changes (Migration 0005)

- Added statuses: `arrived_at_pickup`, `released_by_seller`, `delivery_attempted`
- Added timestamps: `arrived_at_pickup`, `released_at`, `delivery_attempted_at`
- Updated `status` field choices (now 12 options)

## Live Testing Checklist

- [ ] Create order with assigned rider
- [ ] Verify pickup_code and delivery_pin values
- [ ] Test arrived_at_pickup endpoint
- [ ] Test seller release with correct code
- [ ] Test rider pickup endpoint
- [ ] Test on_the_way endpoint
- [ ] Test delivery with correct PIN
- [ ] Verify wallet.balance increased by rider_earning
- [ ] Verify RiderTransaction created
- [ ] Verify total_deliveries incremented
- [ ] Test delivery_attempted flow (3 attempts max)
- [ ] Test cancel_delivery permissions
- [ ] Test delivery_status endpoint

## Known Limitations

1. Location tracking (update-location) doesn't store in DB yet
   - Can add rider_current_latitude/longitude fields if needed

2. Admin manual assignment not fully linked to Phase 4
   - Add assignment timeout tracking in next sprint

3. Ratings/reviews not yet triggered on delivery
   - Can wire up in separate Phase 5

## Phase 4 Summary

✅ Complete delivery state machine (9 transitions)  
✅ Wallet crediting on delivery completion  
✅ Transaction audit trail  
✅ Delivery attempt backoff logic  
✅ PIN verification for security  
✅ Status timeline tracking  
✅ Permission-based cancellation  
✅ Real-time location updates (ready)  

**Total Lines of Code Added:**
- delivery_service.py: 350+ lines
- delivery_views.py: 350+ lines  
- urls.py updates: 10 lines
- Total: 710 lines of Phase 4 code
