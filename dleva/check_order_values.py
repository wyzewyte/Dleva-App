import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from buyer.models import Order

order = Order.objects.filter(status='delivered').first()
if order:
    print(f"Order #{order.id}")
    print(f"total_price: {order.total_price}")
    print(f"delivery_fee: {order.delivery_fee}")
    print(f"rider_earning: {order.rider_earning}")
    print(f"platform_commission: {order.platform_commission}")
    print(f"\nSeller should get (total_price - delivery_fee):")
    print(f"  {order.total_price} - {order.delivery_fee} = {order.total_price - order.delivery_fee}")
else:
    print("No delivered orders")
