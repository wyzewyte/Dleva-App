from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP

class MenuItemCategory(models.Model):
    """Platform-managed categories for menu items (Appetizers, Mains, Desserts, etc.)"""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order (lower = first)")
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Icon name or emoji")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Menu Item Category'
        verbose_name_plural = 'Menu Item Categories'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


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
    # Cloudinary fields for seller profile image
    cloudinary_image_id = models.CharField(max_length=500, blank=True, null=True, help_text="Cloudinary public ID for seller profile image")
    cloudinary_image_url = models.URLField(blank=True, null=True, help_text="Cloudinary secure URL for seller profile image")
    
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


class SellerOTP(models.Model):
    """OTP for seller phone, email, and password reset flows."""
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
        ('verify_phone', 'Verify Phone Number'),
        ('update_profile', 'Update Profile'),
    ]

    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='otps', null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='registration')
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        destination = self.email or self.phone_number or 'unknown destination'
        return f"OTP for {destination} ({self.purpose})"

    class Meta:
        verbose_name = 'Seller OTP'
        verbose_name_plural = 'Seller OTPs'
        ordering = ['-created_at']
    

class Restaurant(models.Model):
    seller = models.OneToOneField(SellerProfile, on_delete=models.CASCADE, related_name='restaurant')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255)
    image = models.ImageField(upload_to='restaurant_images/', blank=True, null=True)
    # Cloudinary fields for restaurant image
    cloudinary_image_id = models.CharField(max_length=500, blank=True, null=True, help_text="Cloudinary public ID for restaurant image")
    cloudinary_image_url = models.URLField(blank=True, null=True, help_text="Cloudinary secure URL for restaurant image")
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
    category = models.ForeignKey(MenuItemCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='menu_items')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    available = models.BooleanField(default=True)
    image = models.ImageField(upload_to='menu_image/', blank=True, null=True)
    # Cloudinary fields for menu item image
    cloudinary_image_id = models.CharField(max_length=500, blank=True, null=True, help_text="Cloudinary public ID for menu item image")
    cloudinary_image_url = models.URLField(blank=True, null=True, help_text="Cloudinary secure URL for menu item image")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__order', 'name']

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"


class RestaurantCommissionConfig(models.Model):
    """Commission deducted from restaurant food subtotal after customer payment."""

    PAYOUT_SCHEDULE_CHOICES = [
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
    ]

    restaurant = models.OneToOneField(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='commission_config',
        null=True,
        blank=True,
        help_text='Leave blank for global default configuration',
    )
    commission_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00'),
        db_column='commission_percentage',
        help_text='Commission percentage deducted from food orders (e.g., 10 = 10%)',
    )
    payout_schedule = models.CharField(
        max_length=20,
        choices=PAYOUT_SCHEDULE_CHOICES,
        default='weekly',
        help_text='How often restaurants are paid out',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Restaurant Commission Config'
        verbose_name_plural = 'Restaurant Commission Configs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['restaurant']),
            models.Index(fields=['is_active']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(commission_percent__gte=0),
                name='restaurant_commission_percent_non_negative',
            ),
        ]

    def __str__(self):
        scope = self.restaurant.name if self.restaurant else 'Global default'
        return f"{scope} - {self.commission_percent}% commission"

    def clean(self):
        super().clean()
        if self.commission_percent is not None and self.commission_percent < 0:
            from django.core.exceptions import ValidationError
            raise ValidationError({'commission_percent': 'Commission percent cannot be negative.'})

    def save(self, *args, **kwargs):
        if self.is_active and self.restaurant is None:
            RestaurantCommissionConfig.objects.filter(
                restaurant__isnull=True,
                is_active=True,
            ).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active_config(cls, restaurant=None):
        if restaurant is not None:
            restaurant_config = cls.objects.filter(
                restaurant=restaurant,
                is_active=True,
            ).first()
            if restaurant_config:
                return restaurant_config

        config = cls.objects.filter(
            restaurant__isnull=True,
            is_active=True,
        ).first()
        if config:
            return config

        return cls.objects.create(
            restaurant=None,
            commission_percent=Decimal('10.00'),
            payout_schedule='weekly',
            is_active=True,
        )

    def calculate_commission_amount(self, food_subtotal):
        food_subtotal = Decimal(str(food_subtotal or 0))
        commission = food_subtotal * (self.commission_percent / Decimal('100'))
        return commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def calculate_restaurant_earnings(self, food_subtotal):
        food_subtotal = Decimal(str(food_subtotal or 0))
        earnings = food_subtotal - self.calculate_commission_amount(food_subtotal)
        return earnings.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


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
