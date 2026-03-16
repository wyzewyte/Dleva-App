# Rider Push Notification System Setup Guide

## Overview
The rider notification system now sends push notifications when orders are assigned. It includes:
- **WebSocket notifications** - Instant in-app notifications for connected riders
- **Firebase FCM (Cloud Messaging)** - Push notifications for riders on mobile or backgrounded app  
- **Database persistence** - All notifications stored in `RiderNotification` model

## What Was Fixed

### ✅ Issue 1: Missing Notification Trigger
**Problem**: When riders were assigned orders, no notification was sent  
**Fix**: Added `PushNotificationService.send_order_assigned()` call in `assignment_service.py` after creating RiderOrder assignments

### ✅ Issue 2: Missing FCM Token Storage
**Problem**: `RiderProfile` model didn't have `fcm_token` field  
**Fix**: Added two new fields to `RiderProfile`:
- `fcm_token` (CharField, max 500 chars) - Stores Firebase Cloud Messaging token
- `fcm_token_updated_at` (DateTimeField) - Tracks when token was last updated

**Migration Applied**: `rider.0015_riderprofile_fcm_token_and_more`

### ✅ Issue 3: Incomplete FCM Implementation  
**Problem**: Firebase FCM code was commented out as TODO  
**Fix**: Implemented full FCM integration with:
- Firebase Admin SDK initialization
- Proper message formatting
- Platform-specific notification configs (Android, iOS)
- Error handling and logging

## Notification Flow

```
Order Assignment
    ↓
[assignment_service.py] assign_order_to_riders()
    ↓
Create RiderOrder record for each eligible rider
    ↓
PushNotificationService.send_order_assigned()
    ↓
├─ Send via WebSocket (if rider connected) → Instant in-app
├─ Send via FCM (if fcm_token available) → Push notification
└─ Save to Database (always) → History
    ↓
Rider receives notification
```

## Setup Instructions

### Step 1: Install Firebase Admin SDK

```bash
pip install firebase-admin
```

Add to `requirements.txt`:
```
firebase-admin==6.2.0
```

### Step 2: Create Firebase Project & Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `serviceAccountKey.json` in your project root (`d:\Dleva\`)

⚠️ **Important**: Add `serviceAccountKey.json` to `.gitignore`:
```
serviceAccountKey.json
```

### Step 3: Get FCM Token from Mobile App

The frontend (React Native/Flutter) needs to:

1. **Initialize Firebase in App**:
```javascript
// Example for React Native Firebase
import messaging from '@react-native-firebase/messaging';

// Get FCM token
const token = await messaging.getToken();
console.log('FCM Token:', token);

// Request notification permission
await messaging.requestPermission();
```

2. **Send Token to Backend**:
```javascript
// Call API endpoint to update rider's FCM token
const response = await fetch('/api/rider/update-fcm-token/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({ fcm_token: token })
});
```

3. **Create Backend Endpoint** (add to `rider/urls.py`):
```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rider.models import RiderProfile
from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_fcm_token(request):
    """Update rider's FCM token for push notifications"""
    try:
        rider = RiderProfile.objects.get(user=request.user)
        fcm_token = request.data.get('fcm_token')
        
        if fcm_token:
            rider.fcm_token = fcm_token
            rider.fcm_token_updated_at = timezone.now()
            rider.save(update_fields=['fcm_token', 'fcm_token_updated_at'])
            
            return Response({
                'message': 'FCM token updated successfully',
                'token_registered': True
            })
        else:
            return Response({'error': 'FCM token not provided'}, status=400)
    
    except RiderProfile.DoesNotExist:
        return Response({'error': 'Rider profile not found'}, status=404)
```

### Step 4: Test the Notifications

#### Test Assignment Notification:
```bash
cd d:\Dleva\dleva
python manage.py shell
```

```python
from buyer.models import Order
from rider.assignment_service import assign_order_to_riders

# Get a test order
order = Order.objects.get(id=1)  # Replace with actual order ID

# Trigger assignment
result = assign_order_to_riders(order)
print(result)

# Check if notifications were created
from rider.models import RiderNotification
notifications = RiderNotification.objects.filter(
    notification_type='assignment'
).order_by('-created_at')[:5]

for n in notifications:
    print(f"{n.rider.full_name}: {n.title} - {n.is_sent}")
```

#### Monitor WebSocket Notifications:
```python
# In frontend, listen to WebSocket
socket.on('send_notification', (data) => {
  console.log('Notification received:', data);
  console.log('Title:', data.title);
  console.log('Message:', data.message);
  console.log('Order ID:', data.data.order_id);
});
```

#### Check FCM Logs:
```bash
# Tail Django logs to see FCM sends
python manage.py runserver --log-level DEBUG

# Look for: "FCM notification sent to [rider_name]"
```

## Notification Types

The system supports multiple notification types:

| Type | Trigger | When |
|------|---------|------|
| `assignment` | Order assigned | When seller marks ready & rider found |
| `status_update` | Order status changes | Pickup, on-way, delivered, etc. |
| `pickup` | Order picked up | Rider confirms pickup |
| `delivery` | Order delivered | Order completion |
| `payout` | Payout approved | Payment processed |
| `dispute` | Order disputed | Dispute filed |
| `warning` | Performance warning | Rating drops below 1.5 |
| `suspension` | Account suspended | Performance suspension |

## Code Examples

### Send Assignment Notification
```python
from rider.notification_service import PushNotificationService

order = Order.objects.get(id=123)
rider_id = 456

PushNotificationService.send_order_assigned(order, rider_id)
```

### Send Custom Notification
```python
PushNotificationService.send_notification(
    rider_id=456,
    notification_type='custom',
    title='Bonus Alert',
    message='You earned a 5% bonus on your next 3 deliveries!',
    data={'bonus_rate': '5%', 'deliveries_left': 3},
    sound=True
)
```

### Get Unread Count
```python
unread = PushNotificationService.get_unread_count(rider_id=456)
print(f"Unread notifications: {unread}")
```

### Get Recent Notifications
```python
notifications = PushNotificationService.get_recent_notifications(
    rider_id=456, 
    limit=10
)

for n in notifications:
    print(f"{n.created_at}: {n.title}")
```

## Troubleshooting

### 🔴 "serviceAccountKey.json not found"
- Make sure the file is in project root (`d:\Dleva\serviceAccountKey.json`)
- Check file isn't in `.gitignore` locally but exists

### 🔴 "firebase-admin not installed"
- Run: `pip install firebase-admin`  
- Verify: `pip list | grep firebase`

### 🔴 Notifications not received on mobile
1. Check if FCM token was captured and sent to backend
2. Verify token is stored in database: `RiderProfile.fcm_token`
3. Check Firebase console for delivery status
4. Ensure app has notification permissions granted

### 🔴 WebSocket notifications work but FCM doesn't
- This is fine for development
- FCM requires Firebase setup
- WebSocket provides instant in-app notifications
- Database persistence ensures no notification loss

### 🔴 Check Notification History
```bash
python manage.py shell
```

```python
from rider.models import RiderNotification

# See all notifications for a rider
notifications = RiderNotification.objects.filter(
    rider__id=456
).order_by('-created_at')

for n in notifications:
    status = "✅ Sent" if n.is_sent else "⏳ Pending"
    read = "✓ Read" if n.is_read else "Unread"
    print(f"{n.created_at} | {status} | {read} | {n.title}")
```

## Database Fields

### RiderProfile (New Fields)
```python
fcm_token = CharField(max_length=500)  # Firebase token for push
fcm_token_updated_at = DateTimeField()  # When token was last updated
```

### RiderNotification (Existing)
```python
rider = ForeignKey(RiderProfile)
notification_type = CharField()  # assignment, status_update, etc.
title = CharField()
message = TextField()
related_order = ForeignKey(Order, null=True)
is_sent = BooleanField()
sent_at = DateTimeField()
is_read = BooleanField()
read_at = DateTimeField()
data = JSONField()  # Metadata
created_at = DateTimeField()
```

## Next Steps

- [ ] Set up Firebase project and download service account key
- [ ] Add frontend code to capture and send FCM token
- [ ] Implement the `/update-fcm-token/` endpoint
- [ ] Test with a real order assignment
- [ ] Monitor logs for "FCM notification sent"
- [ ] Set up mobile push notification handling

---

**Status**: ✅ System implemented and ready for Firebase setup  
**Last Updated**: March 14, 2026
