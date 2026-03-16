from django.db import models
from django.contrib.auth.models import User

class SellerProfile (models.Model):
    BUSINESS_CHOICES = (
        ('restaurant', 'Restaurant'),
        ('student_vendor', 'Student Vendor'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    restaurant_name = models.CharField(max_length=150, blank=True, null=True)
    business_type = models.CharField(max_length=32, choices=BUSINESS_CHOICES, default='restaurant')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True, help_text="Restaurant latitude (for future use)")
    longitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True, help_text="Restaurant longitude (for future use)")
    image = models.ImageField(upload_to='seller_images/', blank=True, null=True)
    
    # Phase 7: Push Notifications
    fcm_token = models.CharField(max_length=500, blank=True, null=True, db_index=True, help_text="Firebase Cloud Messaging token for push notifications")
    fcm_token_updated_at = models.DateTimeField(null=True, blank=True, help_text="Last time FCM token was updated")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.restaurant_name or 'No Restaurant'} ({self.user.username})"
    
    def sync_restaurant_name(self):
        """Sync restaurant_name from linked Restaurant"""
        if hasattr(self, 'restaurant'):
            self.restaurant_name = self.restaurant.name
            self.save()
    

class Restaurant(models.Model):
    seller = models.OneToOneField(SellerProfile, on_delete=models.CASCADE, related_name='restaurant')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255)
    category = models.CharField(max_length=50, blank=True, null=True)
    image = models.ImageField(upload_to='restaurant_images/', blank=True, null=True)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    delivery_time = models.CharField(max_length=50, default='30-45 mins', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, help_text="Restaurant latitude (8 decimal precision)")
    longitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, help_text="Restaurant longitude (8 decimal precision)")

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Auto-sync restaurant name to SellerProfile"""
        super().save(*args, **kwargs)
        self.seller.sync_restaurant_name()

class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_items')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    available = models.BooleanField(default=True)
    image = models.ImageField(upload_to='menu_image/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"

class Payout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]

    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    account_name = models.CharField(max_length=150, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payout #{self.id} - {self.seller.restaurant.name} - ₦{self.amount}"

    class Meta:
        ordering = ['-created_at']

class PayoutDetails(models.Model):
    """Store seller's bank account information for payouts"""
    seller = models.OneToOneField(SellerProfile, on_delete=models.CASCADE, related_name='payout_details')
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    account_name = models.CharField(max_length=150, blank=True, null=True)
    verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payout Details - {self.seller.user.username}"

    class Meta:
        verbose_name_plural = "Payout Details"


class SellerNotification(models.Model):
    """
    Push notifications for sellers (Phase 7)
    Tracks new orders, order status changes, payouts, reviews
    """
    NOTIFICATION_TYPES = [
        ('new_order', 'New Order'),
        ('order_ready', 'Order Ready for Pickup'),
        ('order_cancelled', 'Order Cancelled'),
        ('delivery_assigned', 'Delivery Assigned'),
        ('payout_approved', 'Payout Approved'),
        ('new_review', 'New Review Received'),
        ('order_update', 'Order Status Update'),
        ('system_alert', 'System Alert'),
    ]
    
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_order = models.ForeignKey('buyer.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='seller_notifications')
    
    # Push notification tracking
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Data payload for app
    data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Seller Notification'
        verbose_name_plural = 'Seller Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller', 'is_read']),
            models.Index(fields=['notification_type']),
        ]
