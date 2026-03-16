from buyer.models import Order
from rider.models import RiderProfile

# Check order 13
order = Order.objects.get(id=13)
print(f"Order 13 status: {order.status}")
print(f"Order 13 assigned to rider: {order.rider}")
print(f"Rider ID: {order.rider.id if order.rider else 'None'}")
print(f"Rider User ID: {order.rider.user.id if order.rider else 'None'}")

# Check your logged-in user
from django.contrib.auth.models import User
your_user = User.objects.get(username='rider1')  # Replace with your username
print(f"\nYour User ID: {your_user.id}")

# Try to find your rider profile
try:
    your_rider = RiderProfile.objects.get(user=your_user)
    print(f"Your RiderProfile ID: {your_rider.id}")
except:
    print("You don't have a RiderProfile!")