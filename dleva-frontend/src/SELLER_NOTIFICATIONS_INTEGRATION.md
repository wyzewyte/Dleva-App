# Seller Notifications Frontend Integration Guide

## ✅ Backend Status
- ✅ Notification service implemented
- ✅ Models created (SellerNotification)
- ✅ Signals configured (auto-trigger on new orders)
- ✅ API endpoints created
- ✅ Database migrations applied

## 📱 Frontend Components Created

### 1. **Service Layer**
- `src/services/sellerNotifications.js` - API calls

### 2. **State Management**
- `src/context/SellerNotificationsContext.jsx` - Global notification state
- `src/hooks/useSellerNotifications.js` - Custom hook

### 3. **UI Components**
- `src/components/seller/NotificationBell.jsx` - Bell icon with badge
- `src/components/seller/NotificationsList.jsx` - Popup notification list
- `src/pages/seller/NotificationsPage.jsx` - Full notifications page

### 4. **Styles**
- `NotificationBell.css`
- `NotificationsList.css`
- `NotificationsPage.css`

---

## 🚀 Integration Steps

### Step 1: Wrap App with Provider

In your main app file (e.g., `App.jsx`):

```jsx
import { SellerNotificationsProvider } from './context/SellerNotificationsContext';

function App() {
  return (
    <SellerNotificationsProvider>
      {/* Your app content */}
    </SellerNotificationsProvider>
  );
}

export default App;
```

### Step 2: Add Notification Bell to Header

In your seller header/navbar component:

```jsx
import NotificationBell from '../components/seller/NotificationBell';

function SellerHeader() {
  return (
    <header className="seller-header">
      {/* Other header content */}
      <NotificationBell />
    </header>
  );
}
```

### Step 3: Add Notifications Page Route

In your router/routing file (e.g., `core/urls.py` or routes config):

```python
# In Django seller/urls.py:
urlpatterns = [
    # ... existing urls ...
    path('notifications/', views.seller_notifications_page, name='seller_notifications'),
]
```

Or in React Router:

```jsx
import NotificationsPage from '../pages/seller/NotificationsPage';

const routes = [
  // ... other routes ...
  { path: '/seller/notifications', element: <NotificationsPage /> },
];
```

### Step 4: Create/Update Seller Layout

Make sure the `SellerNotificationsProvider` wraps the entire seller app:

```jsx
function SellerLayout() {
  return (
    <SellerNotificationsProvider>
      <SellerHeader />
      <SellerSidebar />
      <main className="seller-main">
        <Outlet /> {/* or your content */}
      </main>
    </SellerNotificationsProvider>
  );
}
```

---

## 🎨 Component Usage Examples

### Show Notification Badge

```jsx
import useSellerNotifications from '../hooks/useSellerNotifications';

function MyComponent() {
  const { unreadCount } = useSellerNotifications();
  
  return (
    <div>
      You have {unreadCount} unread notifications
    </div>
  );
}
```

### Fetch All Notifications

```jsx
import { useEffect } from 'react';
import useSellerNotifications from '../hooks/useSellerNotifications';

function NotificationsWidget() {
  const { notifications, fetchNotifications } = useSellerNotifications();
  
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  return (
    <ul>
      {notifications.map(notif => (
        <li key={notif.id}>{notif.title}</li>
      ))}
    </ul>
  );
}
```

### Mark as Read

```jsx
import useSellerNotifications from '../hooks/useSellerNotifications';

function NotificationItem({ notification }) {
  const { markAsRead } = useSellerNotifications();
  
  return (
    <div>
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
      {!notification.is_read && (
        <button onClick={() => markAsRead(notification.id)}>
          Mark as read
        </button>
      )}
    </div>
  );
}
```

### Check WebSocket Connection

```jsx
import useSellerNotifications from '../hooks/useSellerNotifications';

function ConnectionStatus() {
  const { isConnected } = useSellerNotifications();
  
  return (
    <div>
      {isConnected ? (
        <span style={{ color: 'green' }}>🟢 Connected</span>
      ) : (
        <span style={{ color: 'red' }}>🔴 Disconnected</span>
      )}
    </div>
  );
}
```

---

## 🔔 Notification Types

Sellers can receive notifications for:

| Type | Trigger | Icon |
|------|---------|------|
| `new_order` | New order received | 🛍️ |
| `order_ready` | Order ready for pickup | ✅ |
| `order_cancelled` | Order cancelled | ❌ |
| `delivery_assigned` | Rider assigned | 🚚 |
| `payout_approved` | Payout processed | 💰 |
| `new_review` | Customer review received | ⭐ |
| `order_update` | Order status changed | 📢 |
| `system_alert` | System maintenance alert | ⚠️ |

---

## 📡 Real-Time Features

### WebSocket Connection
Automatically connects when provider is rendered:
- Auto-reconnect on disconnect
- Receives real-time notifications
- Displays connection status

### Browser Notifications
If permission granted:
- Shows push notification on new events
- Respects user's notification preferences

### Polling Fallback
Every 30 seconds:
- Fetches unread count
- Keeps UI in sync with backend

---

## 🎯 Features Included

✅ **Real-time notifications** via WebSocket  
✅ **Notification badge** with unread count  
✅ **Mark as read** individually or all at once  
✅ **Filter by type** (new orders, cancelled, etc.)  
✅ **Sort options** (newest/oldest)  
✅ **Full notifications page** with details  
✅ **Connection indicator** (green/orange dot)  
✅ **Empty states** and loading states  
✅ **Responsive design** (mobile-optimized)  
✅ **WebSocket auto-reconnect**  
✅ **Browser notification support**  

---

## 🧪 Testing

### 1. Test Backend Notifications

```bash
cd d:\Dleva\dleva
python manage.py shell
```

```python
from buyer.models import Order
from seller.models import SellerNotification
from rider.assignment_service import assign_order_to_riders

# Get an order
order = Order.objects.get(id=1)

# Trigger assignment (should trigger seller notification)
assign_order_to_riders(order)

# Check if notification was created
notification = SellerNotification.objects.filter(
    seller__restaurant__orders=order
).latest('created_at')

print(f"✅ {notification.title}")
print(f"   {notification.message}")
```

### 2. Test Frontend Components

```jsx
// In your React component
import NotificationBell from '../components/seller/NotificationBell';

function TestNotifications() {
  return (
    <div>
      <h1>Test Notifications</h1>
      <NotificationBell />
    </div>
  );
}

export default TestNotifications;
```

### 3. Test WebSocket Connection

Open browser console:
```javascript
// You should see:
// ✅ Seller notifications WebSocket connected
// or
// 🔔 New notification received: { ... }
```

---

## 🐛 Troubleshooting

### ❌ "useSellerNotifications must be used within SellerNotificationsProvider"

**Solution**: Wrap your component tree with the provider:
```jsx
<SellerNotificationsProvider>
  <YourComponent />
</SellerNotificationsProvider>
```

### ❌ WebSocket not connecting

**Check**:
1. Backend WebSocket is running (`daphne` or `channels`)
2. Token is stored in localStorage: `localStorage.getItem('authToken')`
3. Browser console for connection errors
4. Firewall/proxy not blocking WebSocket

### ❌ Notifications not appearing

**Check**:
1. Backend notification was created: Check `SellerNotification` table
2. Frontend provider is wrapping app
3. `fetchNotifications()` is being called
4. API endpoint is returning data

### ❌ Badge not updating

**Solution**: 
- Ensure `unreadCount` state is being updated
- Check network tab to see API calls
- Browser refresh to sync state

---

## 📊 API Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/seller/notifications/` | Get all notifications |
| POST | `/seller/notifications/{id}/read/` | Mark as read |
| GET | `/seller/notifications/unread-count/` | Get unread count |
| POST | `/seller/update-fcm-token/` | Update FCM token |

---

## 🎓 Advanced: Custom Hooks

Create your own notification hook:

```jsx
export function useNewOrderNotifications() {
  const { notifications } = useSellerNotifications();
  
  return notifications.filter(n => n.type === 'new_order');
}

// Usage:
const newOrders = useNewOrderNotifications();
```

---

## 📚 File Structure

```
dleva-frontend/src/
├── services/
│   └── sellerNotifications.js
├── context/
│   └── SellerNotificationsContext.jsx
├── hooks/
│   └── useSellerNotifications.js
├── components/
│   └── seller/
│       ├── NotificationBell.jsx
│       ├── NotificationBell.css
│       ├── NotificationsList.jsx
│       └── NotificationsList.css
└── pages/
    └── seller/
        ├── NotificationsPage.jsx
        └── NotificationsPage.css
```

---

## ✨ Next Steps

1. ✅ Integrate components into seller app
2. ✅ Test with backend notifications
3. ✅ Set up Firebase FCM (optional, for push to mobile)
4. ✅ Add sound/visual alerts
5. ✅ Customize notification UI based on branding

---

**Status**: 🟢 Ready for integration into seller app
**Last Updated**: March 15, 2026
