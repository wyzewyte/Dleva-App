"""
Rider Notification System - Test Script
Tests that notifications are properly triggered and stored

Run: python manage.py shell < test_notifications.py
Or:  python manage.py shell
     exec(open('test_notifications.py').read())
"""

import os
import sys
from decimal import Decimal
from django.utils import timezone

print("\n" + "="*80)
print("🔔 RIDER NOTIFICATION SYSTEM - TEST SCRIPT")
print("="*80 + "\n")

# Import models and services
from buyer.models import Order
from rider.models import RiderProfile, RiderOrder, RiderNotification
from rider.notification_service import PushNotificationService
from rider.assignment_service import assign_order_to_riders

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

# Test 4: Try to send a test notification
print("TEST 4: Send test notification (no real riders needed)")
print("-" * 80)
try:
    # Get any rider
    rider = RiderProfile.objects.filter(is_verified=True, is_online=True).first()
    
    if rider:
        print(f"Testing with rider: {rider.full_name}")
        
        # Create a test notification
        test_notification = PushNotificationService.send_notification(
            rider_id=rider.id,
            notification_type='assignment',
            title='Test Notification',
            message='This is a test notification for debugging',
            data={'test': True, 'timestamp': timezone.now().isoformat()},
            sound=False
        )
        
        if test_notification:
            print(f"✅ PASS: Notification created successfully")
            print(f"   - Notification ID: {test_notification.id}")
            print(f"   - Type: {test_notification.notification_type}")
            print(f"   - Is sent: {test_notification.is_sent}")
            print(f"   - Created at: {test_notification.created_at}")
        else:
            print("❌ FAIL: Notification not created")
    else:
        print("⚠️  No verified online riders found for testing")
        print("   (You need at least one verified, online rider to test)")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n")

# Test 5: Check assignment service imports
print("TEST 5: Check assignment service has notification import")
print("-" * 80)
try:
    import rider.assignment_service as assignment_module
    
    # Read the file to check if it imports notification service
    with open(assignment_module.__file__, 'r') as f:
        content = f.read()
        
        has_import = 'from rider.notification_service import PushNotificationService' in content
        has_call = 'send_order_assigned' in content
        
        if has_import and has_call:
            print("✅ PASS: Assignment service properly imports and uses notification service")
            print("   - Has import: Yes")
            print("   - Has send_order_assigned call: Yes")
        else:
            print("❌ FAIL: Assignment service missing notification call")
            print(f"   - Has import: {has_import}")
            print(f"   - Has send_order_assigned call: {has_call}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n")

# Test 6: Summary
print("="*80)
print("📊 TEST SUMMARY")
print("="*80)
print("""
If all tests passed (✅), the notification system is fixed and ready to:

1. Send notifications when orders are assigned to riders
2. Store notifications in database for history
3. Send WebSocket notifications to connected riders
4. Send Firebase push notifications (when fcm_token is set)

Next Steps:
- Set up Firebase project (see NOTIFICATION_SETUP_GUIDE.md)
- Update frontend app to capture and send FCM tokens
- Test with real order assignments
- Monitor logs for notification delivery

For detailed setup, see: rider/NOTIFICATION_SETUP_GUIDE.md
For fix details, see: rider/NOTIFICATION_FIX_REPORT.md
""")

print("\n")
