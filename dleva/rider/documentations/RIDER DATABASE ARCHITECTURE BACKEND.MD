# ✅ FULL ORDER FLOW

# From Buyer Order → Delivery Complete

---

# 🟢 STEP 1

# Buyer Places Order

Buyer selects food and places order.

Backend does:

• Create Order
• Order status = **pending**

Seller now sees the order request.

---

# 🟡 STEP 2

# Seller Accepts Order

Seller accepts the order.

👉 Order status = **preparing**

Seller starts cooking.

Clear and simple.

---

# 🟠 STEP 3

# Seller Marks Order Ready

Seller taps **Order Ready**

👉 Order status = **available_for_pickup**

Now the rider assignment starts.

---

# 🔵 STEP 4

# Rider Assignment

Backend does:

• Calculate delivery fee
• Find nearby verified online riders
• Send request to top riders

Order status = **awaiting_rider**

If rider accepts:

👉 Order status = **assigned**
👉 Rider locked to order

If rider rejects → next rider.

---

# 🟣 STEP 5

# Rider Goes to Restaurant

Rider taps **Arrived at Pickup**

👉 Order status = **arrived_at_pickup**

Seller knows rider is there.

---

# 🟤 STEP 6

# Seller Release Verification

Seller checks pickup code.

Seller taps **Release Order**

👉 Order status = **released_by_seller**

Prevents wrong pickup.

---

# 🔴 STEP 7

# Rider Picks Up Food

Rider taps **Picked Up**

👉 Order status = **picked_up**

Backend stores pickup time.

Order cannot be reassigned.

---

# 🟤 STEP 8

# Rider On The Way

Rider travels to buyer.

👉 Order status = **on_the_way**

Buyer sees live tracking.

No confusion.

---

# ⚫ STEP 9

# Delivery Verification

Rider arrives.

Buyer gives delivery PIN.

Rider enters PIN.

👉 Order status = **delivered**

Backend stores delivery time.

Delivery verified.

---

# 🟢 STEP 10

# After Delivery Actions

Backend does automatically:

• Rider earning → pending wallet
• Buyer can rate rider
• Dispute window opens for 7 days

Everything recorded.

Just like your rider story where delivery is confirmed and structured. 

---

# 🟡 STEP 11

# After 24 Hours

If no dispute:

• Pending balance → available balance

Rider can withdraw.

If dispute opened:

• Admin reviews before release.

---

# ✅ COMPLETE STATUS LIST

Here are all statuses in order:

1. pending
2. preparing
3. available_for_pickup
4. awaiting_rider
5. assigned
6. arrived_at_pickup
7. released_by_seller
8. picked_up
9. on_the_way
10. delivered
11. cancelled

These are your official order states.

---

# 👍 One Line Summary

Buyer orders → Seller prepares → Order ready → Rider assigned → Pickup verified → Delivered → Wallet updated → Rating → Dispute window.

That is your full system, clean and seamless for UX.
