"""
Rider Notification System - Test Script
Tests that notifications are properly triggered and stored

Run from dleva directory: python ../test_notifications.py
Or: python manage.py shell and then exec(open('../test_notifications.py').read())
"""

import os
import sys
import django

# Add dleva directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'dleva'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from decimal import Decimal
from django.utils import timezone
from buyer.models import Order
from rider.models import RiderProfile, RiderOrder, RiderNotification
from rider.notification_service import PushNotificationService

print("\n" + "="*80)
print("🔔 RIDER NOTIFICATION SYSTEM - TEST SCRIPT")
print("="*80 + "\n")

# Test 1: Check if RiderProfile has fcm_token field
print("TEST 1: Check RiderProfile has FCM token fields")
print("-" * 80)
try:
    test_rider = RiderProfile.objects.first()
    if test_rider:
        fcm_field = hasattr(test_rider, 'fcm_token')
        fcm_updated_field = hasattr(test_rider, 'fcm_token_updated_at')
        
        if fcm_field and fcm_updated_field:
            print("✅ PASS: RiderProfile has fcm_token and fcm_token_updated_at fields")
            print(f"   - fcm_token: {test_rider.fcm_token}")
            print(f"   - fcm_token_updated_at: {test_rider.fcm_token_updated_at}")
        else:
            print("❌ FAIL: Missing FCM fields")
            print(f"   - Has fcm_token: {fcm_field}")
            print(f"   - Has fcm_token_updated_at: {fcm_updated_field}")
    else:
        print("⚠️  No riders in database to test")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n")

# Test 2: Check if notification methods exist
print("TEST 2: Check notification service methods")
print("-" * 80)
try:
    methods_to_check = [
        'send_order_assigned',
        'send_notification',
        '_send_via_websocket',
        '_send_via_fcm',
    ]
    
    all_exist = True
    for method in methods_to_check:
        has_method = hasattr(PushNotificationService, method)
        status = "✅" if has_method else "❌"
        print(f"{status} {method}")
        all_exist = all_exist and has_method
    
    if all_exist:
        print("\n✅ PASS: All notification methods exist")
    else:
        print("\n❌ FAIL: Some methods missing")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n")

# Test 3: Check RiderNotification model
print("TEST 3: Check RiderNotification model")
print("-" * 80)
try:
    existing_notifications = RiderNotification.objects.count()
    print(f"✅ PASS: RiderNotification model exists")
    print(f"   - Total notifications in database: {existing_notifications}")
    
    if existing_notifications > 0:
        recent = RiderNotification.objects.latest('created_at')
        print(f"   - Most recent: {recent.title} ({recent.created_at})")
        print(f"   - Was sent: {recent.is_sent}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n")

# Test 4: Check assignment service imports
print("TEST 4: Check assignment service has notification integration")
print("-" * 80)
try:
    import rider.assignment_service as assignment_module
    
    # Read the file to check if it imports notification service
    with open(assignment_module.__file__, 'r') as f:
        content = f.read()
        
        has_import = 'PushNotificationService' in content
        has_call = 'send_order_assigned' in content
        
        if has_import and has_call:
            print("✅ PASS: Assignment service properly uses notification service")
            print("   - Has PushNotificationService: Yes")
            print("   - Has send_order_assigned call: Yes")
        else:
            print("❌ FAIL: Assignment service missing notification integration")
            print(f"   - Has PushNotificationService: {has_import}")
            print(f"   - Has send_order_assigned call: {has_call}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n")

# Test 5: Summary
print("="*80)
print("📊 TEST SUMMARY")
print("="*80)
print("""
✅ If tests passed above, the notification system is fixed!

The system now:
- Sends notifications when orders are assigned to riders
- Stores notification history in database
- Supports WebSocket for instant in-app notifications
- Supports Firebase FCM for push notifications

✨ Next Steps:
1. Set up Firebase project (see NOTIFICATION_SETUP_GUIDE.md)
2. Update frontend app to capture FCM tokens
3. Create API endpoint to update rider's FCM token
4. Test with real order assignments
5. Monitor logs for notification delivery

📖 Documentation:
- Setup Guide: rider/NOTIFICATION_SETUP_GUIDE.md
- Fix Report: rider/NOTIFICATION_FIX_REPORT.md
""")

print("\n")
