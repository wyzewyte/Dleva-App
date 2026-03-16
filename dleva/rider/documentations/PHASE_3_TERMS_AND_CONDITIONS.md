# 🚴 DLEVA Rider Assignment System
## Phase 3: Terms & Conditions

**Effective Date:** February 22, 2026

---

## 📋 Table of Contents

1. [Assignment Rules](#assignment-rules)
2. [Acceptance & Rejection Policy](#acceptance--rejection-policy)
3. [Delivery Fee Structure](#delivery-fee-structure)
4. [Rider Earning System](#rider-earning-system)
5. [Timeout & Reassignment](#timeout--reassignment)
6. [Verification Requirements](#verification-requirements)
7. [Fair Rotation Policy](#fair-rotation-policy)
8. [Cancellation & Penalties](#cancellation--penalties)
9. [Dispute Resolution](#dispute-resolution)
10. [Code of Conduct](#code-of-conduct)
11. [Safety & Liability](#safety--liability)

---

## 1. Assignment Rules

### 1.1 Eligibility Criteria
A rider is eligible to receive delivery assignments **ONLY IF** all conditions are met:

- ✅ Account status = **Approved**
- ✅ Verification status = **Approved**
- ✅ Phone number = **Verified**
- ✅ Account = **Not suspended**
- ✅ Online status = **Active (is_online = True)**
- ✅ Current location = **Within service area**
- ✅ Active orders < 3 (Maximum 3 simultaneous deliveries)

### 1.2 Ineligible Riders
Riders **CANNOT** receive assignments if:

- ❌ Account under review
- ❌ Documents rejected
- ❌ Suspended or banned
- ❌ Offline status
- ❌ Already managing 3+ deliveries
- ❌ Unverified phone number
- ❌ Missing bank details
- ❌ Profile incomplete (<100%)

### 1.3 Assignment Process

When a seller marks an order **READY**:

1. **Distance Calculation** - System calculates distance from restaurant to delivery location
2. **Fee Calculation** - Delivery fee determined based on distance
3. **Rider Selection** - Top 3 nearest eligible riders identified
4. **Request Sent** - All 3 riders notified simultaneously
5. **Acceptance Window** - 30-second window for rider response
6. **Automatic Lock** - First acceptance locks order
7. **Other Rejections** - Other riders auto-rejected

---

## 2. Acceptance & Rejection Policy

### 2.1 Accepting an Order

When a rider accepts a delivery:

- ✅ Order is **immediately locked** to that rider
- ✅ Delivery fee **FIXED** (never changes)
- ✅ Rider earning **FIXED** (never changes)
- ✅ Other riders are **automatically rejected**
- ✅ Rider must **proceed to restaurant immediately**

**Acceptance Response Time:**
- Riders have **30 seconds** to accept or reject
- After 30 seconds = automatic timeout
- Rider loses opportunity (next rider gets request)

### 2.2 Rejecting an Order

When a rider rejects a delivery:

- ✅ Rider marked as **rejected**
- ✅ Next eligible rider **automatically contacted**
- ✅ Process repeats with remaining riders
- ✅ Rejection is **recorded** (affects fair rotation)

**Rejection Penalty:**
- Multiple rejections → moved **lower in queue**
- Excessive rejections (>5/hour) → **temporary suspension**
- Deliberate pattern rejection → **account review**

### 2.3 Timeout Penalty

If rider does NOT respond within 30 seconds:

- ❌ Order automatically goes to next rider
- ❌ Timeout recorded in rider profile
- ❌ Affects fair rotation ranking
- ⚠️ Multiple timeouts (>10/day) → account review

---

## 3. Delivery Fee Structure

### 3.1 Distance-Based Pricing

| Distance | Fee | Base | Extra |
|----------|-----|------|-------|
| ≤ 3 km | ₦300 | ₦300 | - |
| 3-6 km | ₦400 + (km-3)×₦100 | ₦400 | ₦100/km |
| >6 km | ₦1000 + (km-6)×₦150 | ₦1000 | ₦150/km |

**Example Calculations:**

- **2 km delivery:** ₦300
- **4 km delivery:** ₦400 + (1 × ₦100) = ₦500
- **7 km delivery:** ₦1000 + (1 × ₦150) = ₦1150

### 3.2 Fixed Fee Policy

**CRITICAL RULE:** Once delivery fee is calculated, it **NEVER changes**.

- ✅ Calculated at order ready
- ✅ Fixed until delivery completion
- ✅ No surge pricing added
- ✅ No last-minute changes

**Why?** Transparency and fairness to riders. You agreed to earn ₦X, you earn ₦X.

### 3.3 Fee Components

Total Delivery Fee breakdown:

```
Delivery Fee = Rider Earning + Platform Commission

Example (₦500 fee):
- Rider earning: ₦350 (70%)
- Platform commission: ₦150 (30%)
```

---

## 4. Rider Earning System

### 4.1 Earning Calculation

```
Rider Earning = Delivery Fee × 70% (Minimum ₦250)
```

**Examples:**

| Fee | Calculation | Earning |
|-----|-------------|---------|
| ₦300 | 300 × 70% | ₦210 → ₦250 (min) |
| ₦400 | 400 × 70% | ₦280 |
| ₦500 | 500 × 70% | ₦350 |
| ₦1000 | 1000 × 70% | ₦700 |

**Minimum Earning:** Every delivery, you earn **minimum ₦250** (even for short distances).

### 4.2 When Earnings Posted to Wallet

- ✅ Immediately after delivery marked **delivered**
- ✅ Credited to **RiderWallet balance**
- ✅ Available for **withdrawal** (subject to payout rules)
- ✅ Kept in **transaction history**

### 4.3 Earning Incentives (Future)

These may be added later:

- 🌟 On-time bonus: Extra ₦50 if delivered early
- 🌟 Acceptance rate bonus: 5% extra if >90% acceptance
- 🌟 Rating bonus: ₦100 if maintained >4.8 stars

---

## 5. Timeout & Reassignment

### 5.1 Request Timeout Rule

Each assignment request has a **30-second window**:

```
Timer: 0s ────────────────── 30s
       Ready               Timeout
       |                    |
   Rider notified    Auto-reject & try next
```

### 5.2 What Happens at Timeout

At 30 seconds:

1. ✅ Request marked **timeout**
2. ✅ Rider marked **unavailable** for this order
3. ✅ Next eligible rider **immediately contacted**
4. ✅ Process repeats until rider accepts

### 5.3 Maximum Reassignment Attempts

System attempts assignment **maximum 10 times**:

- Attempt 1-3: Top 3 nearest riders
- Attempt 4-6: Next 3 nearest riders
- Attempt 7-10: Remaining riders within range

**If all 10 attempts fail:**
- Order marked **RIDER_NOT_FOUND**
- Seller & buyer notified immediately
- Admin can manually assign

### 5.4 Rider Can't Undo Acceptance

**FINAL RULE:** Once you **accept**, you **cannot cancel**:

- ❌ No "I changed my mind" cancellations
- ❌ Order locked to you
- ❌ You must complete delivery
- ⚠️ Cancellation after acceptance = suspension

---

## 6. Verification Requirements

### 6.1 Before First Assignment

Rider MUST have:

- ✅ Phone verified (OTP confirmed)
- ✅ Documents approved (KYC check passed)
- ✅ Bank details added (for payouts)
- ✅ Profile 100% complete
- ✅ Account approved by admin
- ✅ Verification status approved

### 6.2 Ongoing Verification

Rider must maintain:

- ✅ Valid documents (not expired)
- ✅ Correct location tracking (GPS enabled)
- ✅ Updated contact number
- ✅ Professional conduct rating

### 6.3 Verification Suspension

If documents become invalid:

- 📄 Expired driver's license → **immediate suspension**
- 📄 Failed re-verification → **30-day ban**
- 📄 Invalid address → **account review**

---

## 7. Fair Rotation Policy

### 7.1 Fair Selection Algorithm

System selects riders using **combined scoring**:

```
Rider Score = Distance Weight (70%) + Fairness Weight (30%)

Fairness Weight considers:
- Time since last assignment
- Monthly total deliveries
- Recent rejection rate
- On-time delivery rate
```

**Why?** Ensures every rider gets opportunities, not just the closest ones.

### 7.2 Rotation Logic

```
Round 1: Highest-scoring available riders picked
Round 2: Lower-scored riders elevated (even if farther)
Round 3: Equal opportunity for all verified riders
```

### 7.3 Gaming Prevention

These actions result in **lower scoring**:

- ❌ Rejecting orders (/5 rejections = -50 points)
- ❌ Timing out (/10 timeouts = -30 points)
- ❌ Cancelling after acceptance = 0 points + review
- ❌ Low rating (<3.5 stars) = -100 points

---

## 8. Cancellation & Penalties

### 8.1 Cancellation Rules

| Scenario | Allowed? | Penalty |
|----------|----------|---------|
| Before acceptance | ✅ Yes | None |
| After acceptance | ❌ No | Suspension |
| During pickup | ❌ No | Suspension + Review |
| After pickup | ❌ No | Account ban |
| Medical emergency | ✅ Yes | Contact support |

### 8.2 Incident Reports

If rider claims emergency:

1. ⚠️ Rider must **report immediately** (via app)
2. 📞 Support contacts rider **within 5 minutes**
3. 🔍 Incident reviewed by team
4. ✅ Approves emergency OR applies penalty

### 8.3 Suspension Tiers

| Violation | First | Second | Third |
|-----------|-------|--------|-------|
| Rejection > 5/hr | 6-hour ban | 24-hour ban | Review |
| Cancellation x1 | Warning | 3-day ban | Review |
| Cancellation x2+ | 7-day ban | 30-day ban | Permanent |
| Assault/abuse | Immediate ban | - | - |

---

## 9. Dispute Resolution

### 9.1 Order Disputes

If dispute arises (distance, earning, etc.):

1. **Rider initiates ticket** in support (within 24 hours)
2. **Support reviews**:
   - GPS tracking data
   - Distance calculation
   - Fee structure verification
   - Rider comments
3. **Decision made** (usually within 24 hours)
4. **Credit issued** if rider is right

### 9.2 Payment Disputes

If payment not credited within 2 hours after delivery:

1. Contact support with:
   - Order ID
   - Screenshot of delivery
   - Proof of delivery
2. System automatically checks wallet
3. If missing → manual credit + investigation

### 9.3 Escalation Path

**Level 1:** Support chat (response: 1 hour)
**Level 2:** Email + support ticket (response: 4 hours)
**Level 3:** Manager review (response: 24 hours)
**Level 4:** Executive review (response: 72 hours)

---

## 10. Code of Conduct

### 10.1 Professional Behavior

Riders must:

✅ Treat customers with **respect and courtesy**
✅ Maintain **clean, presentable appearance**
✅ Arrive **on time or early**
✅ Follow **traffic rules**
✅ Keep **contact number active**
✅ Provide **safe delivery**

### 10.2 Prohibited Behavior

Riders **CANNOT**:

❌ Abuse, harass, or insult customers
❌ Drive under influence (alcohol/drugs)
❌ Exceed speed limits
❌ Open/tamper with orders
❌ Eat from customer's order
❌ Share delivery address without permission
❌ Demand extra tips or payment
❌ Cancel multiple orders without reason

### 10.3 Consequences

| Violation | Action |
|-----------|--------|
| Mild (late arrival) | Warning |
| Moderate (rude behavior) | 3-day suspension |
| Severe (theft/abuse) | Permanent ban |
| Criminal act | Police + ban |

---

## 11. Safety & Liability

### 11.1 Rider Safety

DLEVA commits to:

✅ GPS tracking for rider safety
✅ 24/7 support line for emergencies
✅ Emergency contact to rider's family
✅ Accident coverage (insurance pending)

### 11.2 Rider Liability

Rider is responsible for:

✅ Vehicle maintenance and insurance
✅ Food safety (proper handling, no contamination)
✅ Customer safety (no rash driving)
✅ Personal safety equipment (helmet, reflector)

### 11.3 Food Safety Standards

Rider MUST:

✅ Handle food with **clean hands**
✅ Use **thermal bag** for hot orders
✅ Never expose food to **dust or rain**
✅ Deliver within **optimal temperature range**

Violations = account review + retraining required.

### 11.4 Insurance & Accidents

- **Company insurance:** Covers DLEVA liability
- **Rider insurance:** Rider must maintain personal insurance
- **Accident protocol:** Report within 1 hour
- **Damage claims:** Evidence (photos) required

---

## 12. Term Updates & Amendments

### 12.1 Policy Changes

DLEVA may update these terms with:

- **7 days notice** for major changes
- **Public announcement** in rider app
- **Rider acknowledgment** required

### 12.2 Rider Agreement

By using DLEVA rider system, you agree to:

- ✅ All terms above
- ✅ Future policy updates
- ✅ DLEVA decision-making authority
- ✅ Compliance verification

---

## 📞 Support Contact

**Questions about Phase 3 Assignment?**

- 📧 Email: support@dleva.com
- 💬 App chat: In-app support (24/7)
- 📱 Emergency line: +234-XXX-XXXX

---

## ⚖️ Legal Notice

These terms are legally binding. By accepting assignment requests, riders agree to comply with all rules. DLEVA reserves the right to modify, suspend, or cancel service.

**Last Updated:** February 22, 2026  
**Version:** 1.0 - Phase 3 Initial Release

---

**Made with ❤️ for a fair and transparent delivery system.**
