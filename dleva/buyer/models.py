from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from seller.models import Restaurant, MenuItem
from core.models import Location
import random
import string


class BuyerProfile(models.Model):
    """
    Buyer profile with centralized location management.
    current_location: The buyer's current selected location (for viewing restaurants, etc.)
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True, help_text="Default address (deprecated - use current_location)")
    preferences = models.TextField(blank=True, null=True)
    
    # Phase 1: Centralized location tracking
    current_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='buyer_current_users',
        help_text="Buyer's currently selected location for viewing restaurants"
    )
    
    # Delivery coordinates
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, help_text='Buyer GPS latitude for delivery')
    longitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, help_text='Buyer GPS longitude for delivery')
    
    image = models.ImageField(upload_to='buyer_profile_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Buyer Profile'
        verbose_name_plural = 'Buyer Profiles'


class Cart(models.Model):
    buyer = models.ForeignKey(BuyerProfile, on_delete=models.CASCADE, related_name='carts')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('buyer', 'restaurant')

    def __str__(self):
        return f"Cart for {self.buyer.user.username} - {self.restaurant.name}"

    def total_price(self):
        return sum(item.menu_item.price * item.quantity for item in self.items.all())
    

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)  # ✅ MUST be here
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'menu_item')

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"

    class Meta:
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),                           # Buyer places order
        ('confirming', 'Confirming'),                     # Seller accepts
        ('preparing', 'Preparing'),                       # Seller cooking
        ('available_for_pickup', 'Ready for Pickup'),     # Seller done - system starts rider assignment
        ('awaiting_rider', 'Finding Rider'),              # System assigning to riders
        ('assigned', 'Rider Assigned'),                   # Rider accepted
        ('arrived_at_pickup', 'Rider at Restaurant'),     # Rider at pickup location
        ('picked_up', 'Order Picked Up'),                 # Rider has picked up order
        ('on_the_way', 'On the Way'),                     # Rider heading to buyer location
        ('delivery_attempted', 'Delivery Attempted'),     # Rider attempted delivery (customer unreachable)
        ('delivered', 'Delivered'),                       # Delivered & PIN verified
        ('cancelled', 'Cancelled'),                       # Order cancelled
    ]

    buyer = models.ForeignKey(BuyerProfile, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=500.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    
    delivery_address = models.TextField(blank=True, null=True)
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    
    payment_method = models.CharField(max_length=20, default='card')
    is_rated = models.BooleanField(default=False)
    
    # Delivery fee calculation fields
    distance_km = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    rider_earning = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    platform_commission = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    
    # Rider related fields
    rider = models.ForeignKey('rider.RiderProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    assigned_at = models.DateTimeField(null=True, blank=True)
    assignment_status = models.CharField(max_length=20, choices=[
        ('pending_assignment', 'Pending Assignment'),
        ('assigned', 'Assigned'),
        ('rejected', 'Rejected'),
        ('reassigned', 'Reassigned'),
    ], default='pending_assignment')
    driver_assigned_count = models.IntegerField(default=0)
    final_assigned_at = models.DateTimeField(null=True, blank=True)
    currently_assigned_rider_id = models.IntegerField(null=True, blank=True)
    assignment_timeout_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery tracking fields (Phase 4)
    arrived_at_pickup = models.DateTimeField(null=True, blank=True)  # Timestamp when rider arrived
    picked_up_at = models.DateTimeField(null=True, blank=True)       # Timestamp when rider picked up
    delivered_at = models.DateTimeField(null=True, blank=True)       # Timestamp of delivery
    confirmation_code = models.CharField(max_length=10, null=True, blank=True)  # Single code for pickup & delivery verification
    delivery_proof_photo = models.ImageField(upload_to='delivery_proofs/', null=True, blank=True)
    
    # ✅ FIXED: Removed default
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.restaurant.name}"

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """Generate confirmation_code on first creation"""
        if not self.confirmation_code:
            self.confirmation_code = self.generate_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_code(length=4):
        """Generate random 4-digit code for pickup and delivery verification"""
        return ''.join(random.choices(string.digits, k=length))

    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)  # ✅ FIXED: Removed default

    class Meta:
        unique_together = ('order', 'menu_item')

    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"

    def get_subtotal(self):
        return self.price * self.quantity


class Payment(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    provider = models.CharField(max_length=50, blank=True, null=True, default='paystack')
    # ✅ FIXED: Removed default
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id} - {self.status}"

    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']


class Rating(models.Model):
    buyer = models.ForeignKey(BuyerProfile, on_delete=models.CASCADE, related_name='ratings', null=True, blank=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='ratings')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='ratings')
    rating = models.PositiveIntegerField(default=5)
    comment = models.TextField(blank=True, null=True)
    # ✅ FIXED: Removed default
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('order', 'buyer')
        verbose_name = 'Rating'
        verbose_name_plural = 'Ratings'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.restaurant.name} - {self.rating}⭐"


class LocationHistory(models.Model):
    """
    Tracks buyer's GPS location during active orders
    Enables accurate drop-off and live delivery tracking
    """
    buyer = models.ForeignKey(BuyerProfile, on_delete=models.CASCADE, related_name='location_history')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='location_history', null=True, blank=True)
    
    latitude = models.DecimalField(max_digits=10, decimal_places=8, help_text='Buyer GPS latitude')
    longitude = models.DecimalField(max_digits=10, decimal_places=8, help_text='Buyer GPS longitude')
    accuracy = models.FloatField(default=0, help_text='GPS accuracy in meters')
    
    is_live_tracking = models.BooleanField(default=False, help_text='Whether buyer has GPS tracking enabled')
    recorded_at = models.DateTimeField(auto_now_add=True, help_text='When location was recorded')
    
    class Meta:
        verbose_name = 'Location History'
        verbose_name_plural = 'Location Histories'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['buyer', 'recorded_at']),
            models.Index(fields=['order', 'recorded_at']),
        ]
    
    def __str__(self):
        return f"{self.buyer.user.get_full_name()} @ ({self.latitude}, {self.longitude})"


class AddressCache(models.Model):
    """
    Caches address lookups to reduce Mapbox API calls
    Stores both forward geocoding (address→coordinates) 
    and reverse geocoding (coordinates→address) results
    """
    ADDRESS_TYPE_CHOICES = [
        ('search', 'Search Result'),
        ('reverse', 'Reverse Geocode'),
        ('validated', 'Validated Address'),
    ]
    
    # Search query or coordinates for lookup
    query_hash = models.CharField(max_length=64, unique=True, db_index=True, help_text='Hash of original query')
    query_text = models.TextField(blank=True, help_text='Original address string searched')
    
    # Cached result data
    display_name = models.TextField(help_text='Full formatted address')
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=10, decimal_places=8)
    
    # Additional details
    cache_type = models.CharField(max_length=20, choices=ADDRESS_TYPE_CHOICES, default='search')
    address_type = models.CharField(max_length=50, default='unknown')
    importance = models.FloatField(default=0)
    raw_data = models.JSONField(default=dict, help_text='Full response from Mapbox')
    
    # Cache management
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    access_count = models.PositiveIntegerField(default=1, help_text='How many times this cached result was used')
    
    class Meta:
        verbose_name = 'Address Cache'
        verbose_name_plural = 'Address Caches'
        ordering = ['-last_accessed']
        indexes = [
            models.Index(fields=['query_hash']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.display_name[:50]}"
    
    @staticmethod
    def get_cache_key(query_text: str) -> str:
        """Generate cache key from query"""
        import hashlib
        return hashlib.sha256(query_text.lower().strip().encode()).hexdigest()
    
    def increment_access(self):
        """Track cache usage for analytics"""
        self.access_count += 1
        self.last_accessed = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed'])


class Waitlist(models.Model):
    """Waitlist for locations where vendors are not yet available"""
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=500)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Waitlist Entry'
        verbose_name_plural = 'Waitlist Entries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Waitlist: {self.address} ({self.created_at.date()})"


class WaitlistEntry(models.Model):
    """
    Restaurant-specific waitlist for buyers waiting for a table.
    Tracks buyer position, group size, and estimated wait time.
    """
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('called', 'Called'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    buyer = models.ForeignKey(
        BuyerProfile, 
        on_delete=models.CASCADE, 
        related_name='restaurant_waitlist_entries'
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='waitlist_entries'
    )
    position = models.PositiveIntegerField(
        help_text='Position in the waitlist queue'
    )
    group_size = models.PositiveIntegerField(
        default=1,
        help_text='Number of people in the group'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='waiting',
        db_index=True
    )
    estimated_wait_time = models.PositiveIntegerField(
        default=15,
        help_text='Estimated wait time in minutes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Waitlist Entry'
        verbose_name_plural = 'Waitlist Entries'
        ordering = ['position']
        unique_together = ('buyer', 'restaurant', 'status')
        indexes = [
            models.Index(fields=['restaurant', 'status']),
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.buyer.user.username} - {self.restaurant.name} (Position: {self.position})"
