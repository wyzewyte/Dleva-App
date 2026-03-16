import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
if not settings.configured:
    django.setup()

# Allow testserver for APIClient
settings.ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from buyer.models import Order, BuyerProfile, MenuItem, Restaurant
from seller.models import SellerProfile
from rider.models import RiderProfile, RiderOrder
from rider.assignment_service import assign_order_to_riders, handle_rider_acceptance

def test_secure_checkout():
    print("\n--- Testing Secure Checkout (Price Manipulation Protection) ---")
    # Setup
    user = User.objects.create_user(username='test_buyer_secure', password='password', email='test@test.com')
    buyer = BuyerProfile.objects.create(user=user)
    
    seller_user = User.objects.create_user(username='test_seller_secure', password='password')
    seller = SellerProfile.objects.create(user=seller_user, restaurant_name='Secure Test Restaurant')
    restaurant = Restaurant.objects.create(seller=seller, name='Secure Test Restaurant', address='123 Test St', latitude=6.45, longitude=3.45)
    
    item1 = MenuItem.objects.create(restaurant=restaurant, name='Real Item', price=Decimal('1500.00'))
    
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Attempt checkout with manipulated price
    payload = {
        'restaurant_id': restaurant.id,
        'cartItems': [
            {'id': item1.id, 'name': 'Real Item', 'quantity': 2, 'price': '0.01'} # Manipulated price
        ],
        'delivery_address': '456 Delivery Ave',
        'delivery_latitude': 6.50,
        'delivery_longitude': 3.50,
        'payment_method': 'card',
        'delivery_fee': 500
    }
    
    from django.urls import reverse
    url = reverse('checkout')
    response = client.post(url, payload, format='json')
    
    if response.status_code == 201:
        order_id = response.data['id']
        order = Order.objects.get(id=order_id)
        # Expected total: (1500 * 2) + 500 = 3500
        expected_total = Decimal('3500.00')
        if order.total_price == expected_total:
            print(f"✅ PASS: Order total_price {order.total_price} matches expected DB-calculated total {expected_total}")
        else:
            print(f"❌ FAIL: Order total_price {order.total_price} does NOT match expected {expected_total}. Vulnerability might still exist!")
    else:
        print(f"❌ FAIL: Checkout request failed with status {response.status_code}: {response.data}")

def test_assignment_timeout_worker():
    print("\n--- Testing Assignment Timeout Worker ---")
    # Setup order in awaiting_rider status with past timeout
    user = User.objects.get(username='test_buyer_secure')
    buyer = BuyerProfile.objects.get(user=user)
    restaurant = Restaurant.objects.get(name='Secure Test Restaurant')
    
    # Create a rider to be assigned
    rider_user = User.objects.create_user(username='test_rider_worker', password='password')
    rider = RiderProfile.objects.create(
        user=rider_user, 
        full_name='Test Rider', 
        is_online=True, 
        is_verified=True, 
        account_status='approved', 
        verification_status='approved', 
        phone_verified=True,
        current_latitude=6.46,
        current_longitude=3.46
    )
    # Ensure rider has a wallet
    from rider.models import RiderWallet
    RiderWallet.objects.get_or_create(rider=rider)
    
    order = Order.objects.create(
        buyer=buyer,
        restaurant=restaurant,
        total_price=Decimal('3500.00'),
        delivery_fee=Decimal('500.00'),
        status='awaiting_rider',
        delivery_latitude=6.50,
        delivery_longitude=3.50,
        assignment_timeout_at=timezone.now() - timedelta(minutes=5) # Timed out 5 mins ago
    )
    
    # Run the management command logic
    from django.core.management import call_command
    call_command('process_assignment_timeouts')
    
    # Refresh order
    order.refresh_from_db()
    
    if order.status == 'awaiting_rider' and order.assignment_timeout_at > timezone.now():
        print(f"✅ PASS: Order #{order.id} was re-assigned and timeout updated to {order.assignment_timeout_at}")
    else:
        print(f"❌ FAIL: Order #{order.id} status is {order.status}, timeout is {order.assignment_timeout_at}")

if __name__ == "__main__":
    try:
        test_secure_checkout()
        test_assignment_timeout_worker()
    except Exception as e:
        print(f"Error during tests: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup (optional but good for repeatable tests)
        User.objects.filter(username__startswith='test_').delete()
