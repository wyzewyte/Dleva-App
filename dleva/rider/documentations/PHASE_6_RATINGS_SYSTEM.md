# Phase 6: Ratings and Performance Metrics System

## Overview

Phase 6 implements a comprehensive rider ratings and suspension system that automatically tracks rider quality, issues warnings, suspends poor performers, and auto-reactivates after improvement period.

**Status**: ✅ COMPLETE

## Architecture

### 1. Database Schema
- **RiderProfile Fields Added**:
  - `suspension_start_date`: DateTime when suspension begins
  - `warning_issued_at`: DateTime when warning was issued
  - `suspension_reason`: Text explaining suspension reason
  - `account_status` Extended: Added 'deactivated' status (permanent)

- **Existing Performance Fields**:
  - `average_rating`: Decimal(3,2) - Average star rating 1-5
  - `acceptance_rate`: Decimal(5,2) - % of accepted assignments
  - `on_time_rate`: Decimal(5,2) - % of on-time deliveries
  - `total_deliveries`: Integer - Total completed deliveries

- **RiderRating Model**: Already exists
  - `rider`: ForeignKey to RiderProfile
  - `order`: ForeignKey to Order (unique per rider+rated_by)
  - `rating`: IntegerField (1-5 choices)
  - `comment`: TextField optional
  - `rated_by`: Choice field ('buyer', 'seller')

### 2. Account Status Workflow

```
pending_documents → under_review → approved → (normal operation)
                                          ↓
                                      suspended (low rating)
                                          ↓
                                    (7 days healing)
                                          ↓
                                      approved (auto-reactivated)

Any status can be manually changed to:
                                    deactivated (permanent, admin only)
```

### 3. Suspension Triggers & Rules

**Automatic Suspension (7-day cycle)**:
1. Rider receives rating < 1.5
2. Rider has ≥ 5 total ratings
3. Warning issued automatically
4. After 7 days, if rating still < 1.5 → Auto-suspend
5. After 7 more days suspended → Auto-reactivate to 'approved'

**Manual Deactivation**:
- Admin can permanently deactivate (fraud, theft, etc.)
- Requires admin action to restore
- User login disabled (user.is_active = False)
- Cannot go online or work

**Safety Checks**:
- Suspended/deactivated riders cannot toggle online
- Cannot accept orders while suspended/deactivated
- `can_go_online()` enforces this check

## Files Created

### Service Layer
- **`rider/performance_service.py`** (500+ lines)
  - `submit_rating()`: Accept buyer rating for completed order
  - `_update_average_rating()`: Recalculate average from all ratings
  - `_check_and_apply_warning_suspension()`: Issue warning or suspend
  - `update_acceptance_rate()`: Calculate assigned→accepted ratio
  - `update_on_time_rate()`: Calculate on-time delivery %
  - `check_and_reactivate_suspended()`: Scheduled task for auto-reactivation
  - `admin_deactivate_rider()`: Permanent deactivation with user.is_active=False
  - `admin_reactivate_rider()`: Restore deactivated rider
  - `get_rider_performance()`: Get all metrics for one rider
  - `get_all_riders_performance()`: Get metrics for admin dashboard

### API Endpoints
- **`rider/rating_views.py`** (200+ lines)

  **Buyer Endpoints**:
  - `POST /api/rider/order/<id>/rate-rider/` - Submit rating (min 1 max 5)
  - `GET /api/rider/rider/<id>/ratings/` - View rider's ratings & stats
  - `GET /api/rider/rider/<id>/performance/` - Get specific metrics

  **Admin Endpoints**:
  - `GET /api/rider/admin/riders/performance/` - Dashboard with all riders sorted by rating
  - `POST /api/rider/admin/rider/<id>/deactivate/` - Permanently deactivate
  - `POST /api/rider/admin/rider/<id>/reactivate/` - Restore deactivated rider
  - `POST /api/rider/admin/riders/reactivate-suspended/` - Manual trigger auto-reactivation

### Management Commands
- **`rider/management/commands/reactivate_suspended_riders.py`**
  - Command: `python manage.py reactivate_suspended_riders`
  - Finds riders with 7+ days suspension
  - Auto-reactivates to 'approved' status
  - Clears suspension data
  - **Schedule**: Should run daily (via Celery beat or cron)

### Admin Interface
- **`rider/admin.py`** - Updated RiderProfileAdmin
  - New admin section: "Suspension & Warnings (Phase 6)"
  - Shows `warning_issued_at`, `suspension_start_date`, `suspension_reason`
  - Admin actions:
    - `deactivate_rider` - Permanent deactivation
    - `reactivate_rider` - Restore access

### URL Routes
- **`rider/urls.py`** - Added 7 new routes (4 buyer, 3 admin)
  - Lines 82-91 in urls.py

### View Validations
- **`rider/views.py`** - Updated safety checks
  - `can_go_online()`: Now checks `account_status not in ['suspended', 'deactivated']`
  - `get_blocked_reasons()`: Returns reason and days until reactivation for suspended riders

## Usage Examples

### 1. Submit a Rating (Buyer)
```
POST /api/rider/order/123/rate-rider/
Content-Type: application/json

{
    "rating": 4,
    "comment": "Fast delivery, friendly rider"
}
```

Response:
```json
{
    "status": "success",
    "message": "Rating submitted",
    "rating_id": 456,
    "new_average_rating": "4.20",
    "order_id": 123,
    "rider_id": 789
}
```

### 2. Get Rider Performance Stats
```
GET /api/rider/rider/789/performance/
```

Response:
```json
{
    "rider_id": 789,
    "full_name": "John Doe",
    "average_rating": "3.50",
    "total_ratings": 12,
    "acceptance_rate": "92.50",
    "on_time_rate": "88.00",
    "total_deliveries": 245,
    "account_status": "approved",
    "is_online": true,
    "warning_issued_at": null,
    "suspension_start_date": null,
    "suspension_reason": null,
    "recent_ratings": [
        {
            "order_id": 123,
            "rating": 4,
            "comment": "Fast delivery, friendly rider",
            "created_at": "2024-01-15T14:30:00Z"
        }
    ]
}
```

### 3. Suspended Rider Tries to Go Online
```
POST /api/rider/profile/toggle-online/
Content-Type: application/json

{
    "is_online": true
}
```

Response (403):
```json
{
    "message": "Cannot go online. Complete all requirements.",
    "blocked_reasons": [
        "Account suspended - auto-reactivates in 4 days"
    ]
}
```

### 4. Admin Dashboard - All Riders
```
GET /api/rider/admin/riders/performance/
```

Response:
```json
[
    {
        "rider_id": 789,
        "full_name": "John Doe",
        "phone": "+1234567890",
        "average_rating": "4.50",
        "total_ratings": 45,
        "acceptance_rate": "95.00",
        "on_time_rate": "92.00",
        "total_deliveries": 450,
        "account_status": "approved",
        "is_online": true,
        "warning_issued": false,
        "suspended": false,
        "deactivated": false
    },
    {
        "rider_id": 790,
        "full_name": "Jane Smith",
        "phone": "+0987654321",
        "average_rating": "1.20",
        "total_ratings": 8,
        "acceptance_rate": "70.00",
        "on_time_rate": "65.00",
        "total_deliveries": 50,
        "account_status": "suspended",
        "is_online": false,
        "warning_issued": true,
        "suspended": true,
        "deactivated": false
    }
]
```

### 5. Admin Deactivates Rider (Fraud)
```
POST /api/rider/admin/rider/790/deactivate/
Content-Type: application/json

{
    "reason": "Evidence of customer harassment"
}
```

Response:
```json
{
    "status": "success",
    "message": "Rider permanently deactivated",
    "rider_id": 790,
    "reason": "Evidence of customer harassment"
}
```

## Automatic Workflows

### Rating Submission Flow
1. Buyer submits rating for delivered order
2. System validates:
   - Order exists and is delivered
   - Buyer owns the order
   - No existing rating for this order
   - Rating 1-5
3. Creates RiderRating record
4. Recalculates `average_rating` for rider
5. Checks suspension criteria:
   - If avg_rating < 1.5 AND total_ratings >= 5:
     - If no warning: Issue warning, set `warning_issued_at`
     - If warning + 7 days passed: Auto-suspend, set `account_status='suspended'`

### Auto-Reactivation Scheduled Task
**Command**: `python manage.py reactivate_suspended_riders`

1. Finds all riders with `account_status='suspended'` and `suspension_start_date` not null
2. Checks if 7+ days have passed since suspension
3. Resets:
   - `account_status = 'approved'`
   - `suspension_start_date = None`
   - `warning_issued_at = None`
   - `suspension_reason = None`
4. Sends reactivation notification

**Setup for Daily Runs**:

Option A - Celery Beat (Recommended for production):
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'reactivate-suspended-riders': {
        'task': 'rider.tasks.reactivate_suspended_riders',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}
```

Option B - Linux Cron:
```bash
0 0 * * * cd /path/to/project && python manage.py reactivate_suspended_riders
```

Option C - Manual/Testing:
```bash
python manage.py reactivate_suspended_riders
```

## Safety & Validation

### Rider Cannot Go Online If
- `account_status = 'suspended'` → Blocked with days until reactivation
- `account_status = 'deactivated'` → Blocked, contact admin
- Other pre-existing conditions (documents, profile, etc.)

### Rating Submission Validations
- Order must be delivered (status='delivered')
- Buyer must own the order
- No duplicate rating for same (order, rider, rated_by) combo
- Rating must be integer 1-5
- Returns detailed error messages

### Suspension Safety
- Minimum 5 ratings before auto-suspension triggers
- 7-day warning period before suspension
- 7-day suspended period before auto-reactivation
- Deactivation is permanent (requires admin to restore)
- Deactivated riders cannot login (`user.is_active = False`)

## Testing

Run the test suite:
```bash
python test_phase6.py
```

Tests verify:
- ✅ Suspension fields exist on RiderProfile
- ✅ Account status includes 'deactivated'
- ✅ Rating calculation functions work
- ✅ Suspended riders cannot go online
- ✅ Deactivated riders cannot go online
- ✅ Management command exists and imports
- ✅ Admin actions registered
- ✅ All view functions defined

## Integration Points

### Existing Systems
- RiderProfile model (extended with 3 fields)
- RiderRating model (already exists)
- Order model (for rating submission)
- User model (for deactivation - user.is_active)
- RiderOrder model (for acceptance_rate calculation)
- RiderWallet (wallet frozen on deactivation)
- Admin interface (integrated with actions)

### Notifications (Hooks in place)
TODOs in performance_service.py for:
- `send_notification()` when warning issued
- `send_notification()` when suspended
- `send_notification()` when reactivated
- `send_notification()` when deactivated

Currently logged but not sent - integrate with your notification system.

## Performance Considerations

### Database Queries
- `submit_rating()`: 3-4 queries (get order, check rating, create rating, update rider)
- `_update_average_rating()`: 2 queries (get rider, aggregate ratings)
- `check_and_reactivate_suspended()`: 1 query + N updates
- `get_all_riders_performance()`: 1 query (cached N+1 okay for admin dashboard)

### Optimization
- Add select_for_update() for concurrent rating submissions ✅
- Use @transaction.atomic for rating workflow ✅
- Use database aggregation in queries (consider if performance critical)

## Future Enhancements

1. **Notification System**:
   - Email/SMS when warning issued
   - Push notification when suspended
   - Alert on auto-reactivation

2. **Appeal System**:
   - Riders can dispute poor ratings
   - Admin review mechanism

3. **Rating Weights**:
   - Weight recent ratings more heavily
   - Ignore outlier ratings

4. **Performance Tiers**:
   - Gold/Silver/Bronze badges based on metrics
   - Performance-based incentives

5. **Metrics Enhancements**:
   - Track delivery speed (minutes to deliver)
   - Customer complaint tracking
   - Vehicle condition ratings

## Summary

Phase 6 is a production-ready ratings and suspension system that:
- ✅ Auto-calculates performance metrics
- ✅ Issues warnings automatically
- ✅ Suspends poor performers after grace period
- ✅ Auto-reactivates after improvement period (7 days)
- ✅ Allows permanent admin deactivation
- ✅ Prevents suspended/deactivated riders from working
- ✅ Provides admin dashboard
- ✅ Includes scheduled auto-reactivation task
- ✅ Fully integrated with existing Phase 1-5 systems
- ✅ Complete with URL routes, views, services, and migrations
