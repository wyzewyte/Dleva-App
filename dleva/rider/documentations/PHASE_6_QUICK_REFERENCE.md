# Phase 6 Quick Reference - File Locations & Code Snippets

## 🎯 Core Service Logic - Where Business Rules Live

### `rider/performance_service.py` (500+ lines)

**Key Functions:**

```python
# Rating Submission (line ~50)
PerformanceService.submit_rating(order_id, rider_id, user_id, rating, comment)
# Validates order, creates RiderRating, updates average, checks suspension

# Average Rating (line ~120)
PerformanceService._update_average_rating(rider_id)
# Aggregates all buyer ratings

# Suspension Check (line ~145)
PerformanceService._check_and_apply_warning_suspension(rider_id)
# Issues warning at rating < 1.5, suspends after 7 days

# Acceptance Rate (line ~185)
PerformanceService.update_acceptance_rate(rider_id)
# (Accepted / Assigned) * 100

# On-Time Rate (line ~210)
PerformanceService.update_on_time_rate(rider_id)
# (On-Time Deliveries / Total) * 100

# Auto-Reactivation (line ~240)
PerformanceService.check_and_reactivate_suspended()
# Scheduled task: reactivates after 7 days suspended

# Admin Deactivate (line ~270)
PerformanceService.admin_deactivate_rider(rider_id, admin_user, reason)
# Permanent deactivation + user.is_active = False

# Admin Reactivate (line ~305)
PerformanceService.admin_reactivate_rider(rider_id, admin_user)
# Restore deactivated rider

# Get Stats (line ~330)
PerformanceService.get_rider_performance(rider_id)
# All metrics for single rider

# Dashboard (line ~360)
PerformanceService.get_all_riders_performance()
# All riders sorted by rating
```

## 🌐 API Endpoints - How to Call Them

### `rider/rating_views.py` (200+ lines)

**Buyer endpoints:**
```python
# Line 19
submit_rider_rating(request, order_id)
# POST /api/rider/order/<id>/rate-rider/
# {rating: 1-5, comment: string}

# Line 65
get_rider_ratings(request, rider_id)
# GET /api/rider/rider/<id>/ratings/

# Line 90
get_rider_performance_stats(request, rider_id)
# GET /api/rider/rider/<id>/performance/
```

**Admin endpoints:**
```python
# Line 120
admin_get_all_riders_performance(request)
# GET /api/rider/admin/riders/performance/

# Line 150
admin_deactivate_rider(request, rider_id)
# POST /api/rider/admin/rider/<id>/deactivate/
# {reason: string}

# Line 180
admin_reactivate_rider(request, rider_id)
# POST /api/rider/admin/rider/<id>/reactivate/

# Line 210
admin_check_and_reactivate_suspended(request)
# POST /api/rider/admin/riders/reactivate-suspended/
```

## 🛣️ URL Routes

### `rider/urls.py` (Lines 82-91)

```python
# Phase 6 Rating Endpoints
path('order/<int:order_id>/rate-rider/', rating_views.submit_rider_rating),
path('rider/<int:rider_id>/ratings/', rating_views.get_rider_ratings),
path('rider/<int:rider_id>/performance/', rating_views.get_rider_performance_stats),

# Phase 6 Admin Endpoints  
path('admin/riders/performance/', rating_views.admin_get_all_riders_performance),
path('admin/rider/<int:rider_id>/deactivate/', rating_views.admin_deactivate_rider),
path('admin/rider/<int:rider_id>/reactivate/', rating_views.admin_reactivate_rider),
path('admin/riders/reactivate-suspended/', rating_views.admin_check_and_reactivate_suspended),
```

## 🤖 Scheduled Task

### `rider/management/commands/reactivate_suspended_riders.py`

```python
# Run manually:
python manage.py reactivate_suspended_riders

# Setup in crontab:
0 0 * * * cd /path/to/project && python manage.py reactivate_suspended_riders
```

## 👁️ Admin Interface Changes

### `rider/admin.py` (Lines 1-70)

```python
# New fieldset in RiderProfileAdmin (line ~30)
('Suspension & Warnings (Phase 6)', {
    'fields': ('warning_issued_at', 'suspension_start_date', 'suspension_reason'),
    'classes': ('collapse',)
}),

# New admin actions (lines ~50-70)
def deactivate_rider(self, request, queryset):
    """Permanently deactivate riders"""
    for rider in queryset:
        PerformanceService.admin_deactivate_rider(
            rider.user.id,
            admin_user=request.user,
            reason="Deactivated via admin action"
        )

def reactivate_rider(self, request, queryset):
    """Reactivate deactivated riders"""
    for rider in queryset:
        PerformanceService.admin_reactivate_rider(
            rider.user.id, 
            admin_user=request.user
        )
```

## 🔒 Safety Checks

### `rider/views.py` (Lines 472-510)

```python
# Updated function (line ~472)
def can_go_online(rider):
    # Check suspension/deactivation FIRST
    if rider.account_status in ['suspended', 'deactivated']:
        return False
    # Then check all other requirements...

# Updated function (line ~488) 
def get_blocked_reasons(rider):
    # If suspended, show days until reactivation
    if rider.account_status == 'suspended':
        days_remaining = 7 - (timezone.now() - rider.suspension_start_date).days
        return [f'Account suspended - auto-reactivates in {days_remaining} days']
    
    # If deactivated, show permanent message
    if rider.account_status == 'deactivated':
        return ['Account permanently deactivated - contact admin']
```

## 📊 Model Updates

### `rider/models.py`

**New fields added to RiderProfile:**
```python
# Field 1: When suspension started
suspension_start_date = models.DateTimeField(null=True, blank=True)

# Field 2: When warning was issued  
warning_issued_at = models.DateTimeField(null=True, blank=True)

# Field 3: Why suspended
suspension_reason = models.TextField(blank=True, default='')

# Updated account_status choices:
ACCOUNT_STATUS_CHOICES = [
    ('pending_documents', 'Pending Documents'),
    ('under_review', 'Under Review'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('suspended', 'Suspended'),      # ← NEW
    ('deactivated', 'Deactivated'),   # ← NEW
]
```

## 🔄 Database Migration

### `rider/migrations/0005_phase_6_ratings_performance.py`

```python
# Migration status: ✓ APPLIED
# Changes:
# 1. AlterField: account_status (added choices)
# 2. AddField: suspension_start_date
# 3. AddField: warning_issued_at  
# 4. AddField: suspension_reason
```

## 📝 Constants & Rules

In `rider/performance_service.py`:

```python
MINIMUM_RATINGS_FOR_WARNING = 5          # Must have 5+ ratings before warning
WARNING_THRESHOLD_RATING = Decimal('1.5') # Rating must be < 1.5 to trigger
SUSPENSION_DURATION_DAYS = 7              # Suspended for 7 days
```

**Workflow Timeline:**
1. Rating submitted → 0 sec
2. Average calculated → 0 sec
3. If avg < 1.5 AND count >= 5 → Warning issued → warning_issued_at set
4. After 7 days → Auto-suspension if rating still < 1.5 → suspension_start_date set
5. After 7 more days suspended → Auto-reactivation → approval status + clearing dates

## 🧪 Testing

### `test_phase6.py`

```python
# Run tests:
python test_phase6.py

# Tests:
✓ Suspension fields on RiderProfile
✓ Account status has 'deactivated'
✓ Rating calculation works
✓ Suspended riders blocked from going online
✓ Deactivated riders blocked from going online
✓ Management command exists
✓ Admin actions registered
✓ View functions defined
```

## 📚 Full Documentation

See `PHASE_6_RATINGS_SYSTEM.md` for:
- Complete architecture overview
- Usage examples with curl/JSON
- Auto-reactivation setup (Celery, cron)
- Performance considerations
- Future enhancements
- Integration with Phase 1-5

---

## Summary Table

| Component | Location | Status | Lines |
|-----------|----------|--------|-------|
| Service Layer | `performance_service.py` | ✓ Complete | 500+ |
| API Views | `rating_views.py` | ✓ Complete | 200+ |
| URL Routes | `urls.py` | ✓ Complete | 7 routes |
| Admin Actions | `admin.py` | ✓ Complete | 2 actions |
| Scheduled Task | `commands/reactivate_suspended_riders.py` | ✓ Complete | 20 |
| Safety Checks | `views.py` | ✓ Complete | Modified |
| Models | `models.py` | ✓ Complete | 3 fields |
| Migration | `migrations/0005_...py` | ✓ Applied | - |
| Documentation | `PHASE_6_RATINGS_SYSTEM.md` | ✓ Complete | 500 |
| Tests | `test_phase6.py` | ✓ Complete | 200 |

**All components ready for production deployment ✓**
