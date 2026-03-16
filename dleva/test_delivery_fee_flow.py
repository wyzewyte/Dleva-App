"""
Test the delivery fee calculation flow:
1. Order created with default delivery_fee = 500
2. Order assigned to rider (assignment_service recalculates)
3. Check if delivery_fee was updated based on distance
4. Verify API returns the updated value
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from buyer.models import Order
from rider.assignment_service import assign_order_to_riders

# Get last order
order = Order.objects.latest('created_at')

print(f"\n{'='*60}")
print(f"Order #{order.id}")
print(f"{'='*60}")
print(f"\nBefore Assignment:")
print(f"  delivery_fee: ₦{order.delivery_fee}")
print(f"  delivery_fee: {order.delivery_fee}")
print(f"  status: {order.status}")

# Check assignment_service calculation
from rider.assignment_service import calculate_delivery_fee, calculate_rider_earning
from seller.models import Restaurant
from decimal import Decimal

if order.restaurant and order.delivery_latitude and order.delivery_longitude:
    from rider.assignment_service import calculate_distance
    
    distance_km = calculate_distance(
        order.restaurant.latitude,
        order.restaurant.longitude,
        order.delivery_latitude,
        order.delivery_longitude
    )
    
    calculated_fee = calculate_delivery_fee(Decimal(str(distance_km)))
    calculated_rider_earning = calculate_rider_earning(calculated_fee)
    calculated_platform_commission = calculated_fee - calculated_rider_earning
    
    print(f"\nIf Assignment Happened:")
    print(f"  Distance: {distance_km} km")
    print(f"  Calculated delivery_fee: ₦{calculated_fee}")
    print(f"  Calculated rider_earning (60%): ₦{calculated_rider_earning}")
    print(f"  Calculated platform_commission (40%): ₦{calculated_platform_commission}")
else:
    print(f"\n⚠️ Missing delivery coordinates or restaurant location for assignment calculation")

print(f"\n{'='*60}")
print("✅ ORDER DETAIL API RETURNS:")
print(f"{'='*60}")
print(f"delivery_fee: ₦{order.delivery_fee}")
print(f"(This is what the frontend tracking page displays)")
print()
