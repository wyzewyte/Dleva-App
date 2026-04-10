from buyer.models import BuyerProfile
from buyer.notification_service import BuyerPushNotificationService
from django.utils import timezone

# Get the buyer
buyer = BuyerProfile.objects.get(id=1)
print(f"Testing buyer: {buyer.user.username} (ID: {buyer.id})")

# FCM token (same one used for rider and seller)
fcm_token = "ecS8rKKSrgrffG78B36zty:APA91bGv1fwva_CwnykPpIDUx00FEztxlUW0Oy49v8GI-ih_gksI3Q7_Htf6QXa2HFMNh9U2BLDrF8sj94AUoaUD52BclLJLbvoApzgLf3v-gb_06uT7I88"

# Register FCM token if not already registered
if not buyer.fcm_token:
    buyer.fcm_token = fcm_token
    buyer.fcm_token_updated_at = timezone.now()
    buyer.save()
    print("FCM token registered!")
else:
    print(f"FCM token already registered: {buyer.fcm_token[:50]}...")

# Send test notification with new favicon logo
print("\nSending notification with favicon logo...")
notification = BuyerPushNotificationService.send_notification(
    buyer_id=1,
    notification_type='order_ready',
    title='Order Ready - Favicon Test',
    message='Now showing with favicon.svg logo',
    data={
        'order_id': '456',
        'restaurant': 'Test Restaurant',
    },
    order_id=456,
    sound=True,
)

if notification:
    print(f"SUCCESS: Notification sent!")
    print(f"  - Type: {notification.notification_type}")
    print(f"  - Title: {notification.title}")
    print(f"  - Sent: {notification.is_sent}")
    print(f"\nNext steps:")
    print(f"1. Hard refresh browser: Ctrl+Shift+R")
    print(f"2. Login as buyer1")
    print(f"3. Look for notification pop-up with FAVICON logo")
    print(f"4. Click it -> routes to /buyer/orders/456")
else:
    print("ERROR: Failed to send notification")



# RIDER TEST NOTIFICATOIN
from rider.notification_service import PushNotificationService
from rider.models import RiderProfile
from core.push_tokens import register_push_token

# Your real FCM token from localStorage
REAL_FCM_TOKEN = "ecS8rKKSrgrffG78B36zty:APA91bHAAwwdHlOzvnTbA0Jq0568ilz7XVHS6n5ckATXirK4RuE51gSMzXO--sLaOth5gtTXx2WNHd_aPMAETyrtqyczx4q-DH0XJqH5gMhCV5VxwWk_YX4"

# Register it
rider = RiderProfile.objects.get(id=4)
register_push_token(rider, REAL_FCM_TOKEN)
print(f"✅ Real token registered for {rider.full_name}")

# Now test notifications
print("\n🔔 Sending test notifications...\n")

PushNotificationService.send_payout_approved(rider_id=4, payout_amount=5000)
print("✅ Payout notification sent")

PushNotificationService.send_suspension_warning(rider_id=4, rating=1.3)
print("✅ Warning notification sent")

PushNotificationService.send_notification(
    rider_id=4,
    notification_type='assignment',
    title='🆕 New Delivery Available',
    message='Order from Lekki - ₦5,500',
    sound=True
)
print("✅ Assignment notification sent")