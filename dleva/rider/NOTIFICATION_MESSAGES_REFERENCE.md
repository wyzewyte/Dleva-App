# Rider Notification Messages - Reference Guide

## Notification Types & Messages

Here's what messages riders will receive for different events:

---

## 1. 🎯 ORDER ASSIGNMENT (FIXED - NOW WORKING)

**Trigger**: When seller marks order ready and system finds riders  
**Priority**: HIGH with sound  
**Recipients**: Top 3 eligible riders

**Message Example**:
```
Title: "New Order Assigned"
Message: "New delivery: Pizza Palace → 123 Main St"

Data:
{
  "order_id": 456,
  "restaurant": "Pizza Palace",
  "amount": "₦2,500.00",
  "address": "123 Main St, Lagos"
}
```

**When Rider Should See**:
- ✅ If app is open: Popup notification in app
- ✅ If app backgrounded: Push notification on phone
- ✅ If offline: Stored in notification history

---

## 2. 📍 ORDER STATUS UPDATES

**Trigger**: When order status changes  
**Types**:
- Rider arrived at restaurant
- Order picked up
- Order on the way
- Order delivered

**Message Examples**:
```
Status: ARRIVED AT RESTAURANT
Title: "Rider arrived at restaurant"
Message: "Ready for pickup"

Status: PICKED UP
Title: "Order picked up"
Message: "Order picked up from Pizza Palace"

Status: ON THE WAY
Title: "Order on the way"
Message: "Rider is delivering your order"

Status: DELIVERED
Title: "Order delivered"
Message: "Order successfully delivered"
```

---

## 3. 💰 PAYOUT APPROVED

**Trigger**: When rider's payout is processed  
**Priority**: HIGH with sound

**Message Example**:
```
Title: "Payout Approved"
Message: "Payout of ₦5,250.00 has been approved"

Data:
{
  "amount": "5250.00",
  "type": "payout_approved"
}
```

---

## 4. ⚠️ PERFORMANCE WARNING

**Trigger**: When rider's rating drops below 1.5  
**Priority**: NORMAL

**Message Example**:
```
Title: "Performance Warning"
Message: "Your rating is below 1.5 (1.2). You have 7 days to improve."

Data:
{
  "rating": "1.2",
  "type": "warning"
}
```

---

## 5. 🚫 ACCOUNT SUSPENSION

**Trigger**: When account is suspended for low ratings  
**Priority**: HIGH with sound

**Message Example**:
```
Title: "Account Suspended"
Message: "Your account has been suspended for 7 days due to low ratings."

Data:
{
  "type": "suspended"
}
```

---

## 6. 🔴 ORDER DISPUTE

**Trigger**: When dispute is filed for an order  
**Priority**: HIGH with sound

**Message Example**:
```
Title: "Order Dispute"
Message: "Dispute filed for order #456"

Data:
{
  "order_id": "456",
  "dispute_id": "789"
}
```

---

## Current Notification Status

### ✅ NOW WORKING:
- [ ] Assignment notification ← **FIXED in this update**
- [ ] Status updates (via Order model sync)
- [ ] Database persistence (auto-saved)
- [ ] WebSocket delivery (instant, in-app)

### ⏳ REQUIRES FIREBASE SETUP:
- [ ] Firebase push notifications
- [ ] Mobile phone notifications
- [ ] Background app notifications

### 📅 FUTURE ENHANCEMENTS:
- [ ] SMS notifications for critical alerts
- [ ] Email notifications
- [ ] In-app badge counts
- [ ] Notification preferences/settings

---

## Testing Notifications

### Test Assignment Notification:

1. **Ensure riders are online**:
   ```python
   python manage.py shell
   rider = RiderProfile.objects.first()
   rider.is_online = True
   rider.save()
   ```

2. **Create a test order** with delivery coordinates

3. **Mark as ready** via seller API:
   ```
   POST /api/seller/mark-order-ready/{order_id}/
   ```

4. **Check logs** for:
   ```
   [ASSIGNMENT] ✅ Assigned to [Rider Name]
   [ASSIGNMENT] 📱 Notification sent to [Rider Name]
   ```

5. **Verify in database**:
   ```python
   notifications = RiderNotification.objects.filter(
       notification_type='assignment'
   ).order_by('-created_at')[:3]
   
   for n in notifications:
       print(f"{n.rider.full_name}: {n.title}")
       print(f"  - Sent: {n.is_sent} at {n.sent_at}")
       print(f"  - Order: {n.related_order_id}")
   ```

### Test WebSocket Notification:

Frontend should listen:
```javascript
socket.on('send_notification', (data) => {
  console.log('🔔 Notification Received:', data);
  console.log('Type:', data.notification_type);
  console.log('Title:', data.title);
  console.log('Message:', data.message);
  console.log('Data:', data.data);
});
```

---

## Notification Settings (To Be Implemented)

Riders should be able to control notifications:

```
Notification Preferences:
☑️ Order assignments
☑️ Status updates  
☑️ Payouts
☑️ Performance alerts
☑️ Disputes
☑️ Suspensions

Sound Preferences:
☑️ Sound enabled
☑️ Vibration enabled
☑️ Quiet hours: 10 PM - 7 AM

Push Notification Frequency:
○ Immediately
○ Batched hourly
○ Batched daily
```

---

## Common Issues & Solutions

### ❓ Rider Says: "I'm not getting notifications"

**Check 1**: Is rider online?
```python
rider = RiderProfile.objects.get(id=rider_id)
print(f"Online: {rider.is_online}")  # Should be True
```

**Check 2**: Did notification get created?
```python
from rider.models import RiderNotification
recent = RiderNotification.objects.filter(
    rider__id=rider_id
).order_by('-created_at').first()
print(f"Received: {recent.created_at if recent else 'None'}")
```

**Check 3**: Is WebSocket connected?
```
Frontend should show connection status in browser console
```

**Check 4**: Does rider have FCM token?
```python
rider = RiderProfile.objects.get(id=rider_id)
print(f"FCM Token: {rider.fcm_token}")  # Should have value for push
```

### ❓ Notification Created But Not Delivered

**Check**: Mobile app has permission
- iOS: Settings → Notifications → App Name → Allow Notifications
- Android: Settings → Apps → Permissions → Notifications

### ❓ How to Re-send a Notification?

```python
from rider.notification_service import PushNotificationService
from rider.models import RiderNotification

# Get notification
notif = RiderNotification.objects.get(id=notif_id)

# Resend if failed
if not notif.is_sent:
    PushNotificationService._send_via_fcm(
        rider=notif.rider,
        notification=notif,
        sound=True
    )
```

---

## Message Customization

To customize notification messages, edit `rider/notification_service.py`:

```python
# NOTIFICATION_CONFIG dictionary (lines 24-66)
NOTIFICATION_CONFIG = {
    'assignment': {
        'title': 'New Order Assigned',  # Customize here
        'sound': True,
        'priority': 'high',
    },
    # ... other types
}
```

---

## Database Queries

### Get All Unread Notifications for Rider:
```python
from rider.models import RiderNotification

unread = RiderNotification.objects.filter(
    rider__id=rider_id,
    is_read=False
).order_by('-created_at')

print(f"Unread: {unread.count()}")
```

### Get Notifications by Type:
```python
assignments = RiderNotification.objects.filter(
    notification_type='assignment'
).order_by('-created_at')[:10]
```

### Mark as Read:
```python
notif = RiderNotification.objects.get(id=notif_id)
notif.is_read = True
notif.read_at = timezone.now()
notif.save()
```

### Get Notification History for Order:
```python
notifications = RiderNotification.objects.filter(
    related_order_id=order_id
).order_by('-created_at')
```

---

## Frontend Integration Points

The frontend should:

1. **On App Start**: Capture and send FCM token
   ```javascript
   POST /api/rider/update-fcm-token/ 
   { fcm_token: "..." }
   ```

2. **Connect WebSocket**: Listen for real-time notifications
   ```javascript
   socket.on('send_notification', handleNotification)
   ```

3. **Display Notifications**: 
   - Show popup for critical messages (assignments, disputes)
   - Show toast for regular updates
   - Show badge with unread count

4. **Handle User Actions**:
   - Accept/reject on assignment notification
   - Mark as read when viewed
   - Process deep links to orders

---

## Monitoring & Debugging

### Enable Detailed Logging:

In `dleva/core/settings.py`:
```python
LOGGING = {
    'loggers': {
        'rider.notification_service': {
            'level': 'DEBUG',  # Verbose logs
            'handlers': ['console'],
        }
    }
}
```

### Watch Logs in Real-time:
```bash
# Terminal 1: Run server
python manage.py runserver

# Terminal 2: Watch logs (Windows)
Get-Content -Path logs/django.log -Wait
```

### Check Notification Delivery:
```bash
# Search for notification sends
grep "Notification sent" logs/django.log | tail -20

# Count successful sends
grep -c "Notification sent" logs/django.log

# Find errors
grep "Error sending notification" logs/django.log
```

---

**Last Updated**: March 14, 2026  
**Status**: ✅ Assignment notifications working, Firebase setup pending
