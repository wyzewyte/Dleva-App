import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from buyer.models import Order
from decimal import Decimal

order = Order.objects.get(id=6)

print(f"Order #{order.id}")
print(f"total_price: ₦{order.total_price}")
print(f"delivery_fee: ₦{order.delivery_fee}")
print(f"\n✅ NEW CALCULATION:")
print(f"Rider earning (60%): ₦{order.delivery_fee * Decimal('0.60')}")
print(f"Platform commission (40%): ₦{order.delivery_fee * Decimal('0.40')}")
print(f"\n📊 PAYOUT BREAKDOWN:")
print(f"Seller gets: ₦{order.total_price} - ₦{order.delivery_fee} = ₦{order.total_price - order.delivery_fee}")
print(f"Rider gets: 60% of ₦{order.delivery_fee} = ₦{order.delivery_fee * Decimal('0.60')}")
print(f"Platform gets: 40% of ₦{order.delivery_fee} = ₦{order.delivery_fee * Decimal('0.40')}")
print(f"TOTAL: ₦{(order.total_price - order.delivery_fee) + (order.delivery_fee * Decimal('0.60')) + (order.delivery_fee * Decimal('0.40'))}")
