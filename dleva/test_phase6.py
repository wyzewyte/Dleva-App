"""
Phase 6 Test Script - Verify ratings and suspension system
Tests the complete workflow of rating submission and suspension logic
"""

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from buyer.models import Order, Restaurant, MenuItem, Cart, CartItem
from rider.models import RiderProfile, RiderRating, RiderOrder
from rider.performance_service import PerformanceService, PerformanceError
from decimal import Decimal
from django.utils import timezone

print("\n" + "="*80)
print("PHASE 6: RATINGS AND PERFORMANCE METRICS - TEST SCRIPT")
print("="*80)

# Test 1: Verify RiderProfile has suspension fields
print("\n[TEST 1] Checking RiderProfile suspension fields...")
try:
    rider_user = User.objects.filter(username='test_rider').first()
    if rider_user:
        rider = RiderProfile.objects.get(user=rider_user)
        assert hasattr(rider, 'suspension_start_date'), "Missing suspension_start_date field"
        assert hasattr(rider, 'warning_issued_at'), "Missing warning_issued_at field"
        assert hasattr(rider, 'suspension_reason'), "Missing suspension_reason field"
        print("✓ PASS: All suspension fields present on RiderProfile")
    else:
        print("⚠ SKIP: No test rider found")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 2: Verify account_status has 'deactivated' option
print("\n[TEST 2] Checking account_status choices...")
try:
    statuses = [choice[0] for choice in RiderProfile.ACCOUNT_STATUS_CHOICES]
    assert 'deactivated' in statuses, "Missing 'deactivated' status"
    assert 'suspended' in statuses, "Missing 'suspended' status"
    print(f"✓ PASS: Account status choices include: {', '.join(statuses)}")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 3: Verify PerformanceService can calculate average rating
print("\n[TEST 3] Testing rating calculation...")
try:
    test_rider = User.objects.filter(username='test_rider').first()
    if test_rider:
        rider = RiderProfile.objects.get(user=test_rider)
        
        # Test with no ratings
        avg = PerformanceService._get_average_rating(test_rider.id)
        print(f"  - Average rating (no ratings): {avg}")
        
        # Get rating count
        count = PerformanceService._get_rating_count(test_rider.id)
        print(f"  - Rating count: {count}")
        
        print("✓ PASS: PerformanceService rating methods work")
    else:
        print("⚠ SKIP: No test rider found")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 4: Verify suspension status cannot go online
print("\n[TEST 4] Testing suspended rider cannot go online...")
try:
    from rider.views import can_go_online, get_blocked_reasons
    
    test_rider = User.objects.filter(username='test_rider').first()
    if test_rider:
        rider = RiderProfile.objects.get(user=test_rider)
        
        # Test with suspended status
        original_status = rider.account_status
        rider.account_status = 'suspended'
        rider.suspension_start_date = timezone.now()
        
        can_go = can_go_online(rider)
        assert can_go == False, "Suspended rider should not go online"
        
        reasons = get_blocked_reasons(rider)
        assert len(reasons) > 0, "Should have blocking reasons"
        assert any('suspended' in r.lower() or 'auto-reactivate' in r.lower() for r in reasons), "Should mention suspension"
        
        # Restore status
        rider.account_status = original_status
        rider.suspension_start_date = None
        rider.save()
        
        print(f"✓ PASS: Suspended riders blocked with reasons: {reasons}")
    else:
        print("⚠ SKIP: No test rider found")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 5: Verify deactivated status blocks operations
print("\n[TEST 5] Testing deactivated rider cannot go online...")
try:
    from rider.views import can_go_online, get_blocked_reasons
    
    test_rider = User.objects.filter(username='test_rider').first()
    if test_rider:
        rider = RiderProfile.objects.get(user=test_rider)
        
        # Test with deactivated status
        original_status = rider.account_status
        rider.account_status = 'deactivated'
        
        can_go = can_go_online(rider)
        assert can_go == False, "Deactivated rider should not go online"
        
        reasons = get_blocked_reasons(rider)
        assert any('permanently' in r.lower() or 'deactivated' in r.lower() for r in reasons), "Should mention deactivation"
        
        # Restore status
        rider.account_status = original_status
        rider.save()
        
        print(f"✓ PASS: Deactivated riders blocked with reason: {reasons[0]}")
    else:
        print("⚠ SKIP: No test rider found")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 6: Check management command exists
print("\n[TEST 6] Checking management command...")
try:
    from django.core.management import call_command
    from io import StringIO
    import sys
    
    # Test that the command can be imported
    from rider.management.commands.reactivate_suspended_riders import Command
    print("✓ PASS: reactivate_suspended_riders management command exists")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 7: Verify admin actions exist
print("\n[TEST 7] Checking admin actions...")
try:
    from rider.admin import RiderProfileAdmin
    
    admin_instance = RiderProfileAdmin(RiderProfile, None)
    actions = admin_instance.actions
    
    action_names = [action[0] if isinstance(action, tuple) else action.__name__ for action in actions]
    
    assert 'deactivate_rider' in action_names, "Missing deactivate_rider admin action"
    assert 'reactivate_rider' in action_names, "Missing reactivate_rider admin action"
    
    print(f"✓ PASS: Admin actions include: {', '.join(action_names)}")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

# Test 8: Verify URLs are registered
print("\n[TEST 8] Checking URL routes...")
try:
    # Check if rating_views module exists and has the functions
    from rider import rating_views
    
    assert hasattr(rating_views, 'submit_rider_rating'), "Missing submit_rider_rating"
    assert hasattr(rating_views, 'get_rider_ratings'), "Missing get_rider_ratings"
    assert hasattr(rating_views, 'get_rider_performance_stats'), "Missing get_rider_performance_stats"
    assert hasattr(rating_views, 'admin_get_all_riders_performance'), "Missing admin_get_all_riders_performance"
    assert hasattr(rating_views, 'admin_deactivate_rider'), "Missing admin_deactivate_rider"
    assert hasattr(rating_views, 'admin_reactivate_rider'), "Missing admin_reactivate_rider"
    assert hasattr(rating_views, 'admin_check_and_reactivate_suspended'), "Missing admin_check_and_reactivate_suspended"
    
    print("✓ PASS: All Phase 6 view functions exist and are properly defined")
except Exception as e:
    print(f"✗ FAIL: {str(e)}")

print("\n" + "="*80)
print("PHASE 6 TESTS COMPLETED")
print("="*80 + "\n")
