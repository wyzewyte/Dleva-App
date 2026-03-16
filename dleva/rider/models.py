from django.db import models
from django.contrib.auth.models import User
from buyer.models import Order
from core.models import Location


class RiderProfile(models.Model):
    """Main rider account model"""
    VEHICLE_CHOICES = [
        ('bike', 'Bike'),
        ('bicycle', 'Bicycle'),
        ('car', 'Car'),
    ]
    
    VERIFICATION_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    ACCOUNT_STATUS_CHOICES = [
        ('pending_documents', 'Pending Documents'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
        ('deactivated', 'Deactivated'),  # Phase 6: Permanent deactivation
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='rider_profile')
    username = models.CharField(max_length=150, unique=True, db_index=True, null=True, blank=True)
    email = models.EmailField(unique=True, db_index=True, null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    full_name = models.CharField(max_length=150)
    profile_photo = models.ImageField(upload_to='rider_images/', blank=True, null=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES)
    vehicle_plate_number = models.CharField(max_length=50, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='pending', db_index=True)
    phone_verified = models.BooleanField(default=False, db_index=True)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='pending_documents', db_index=True)
    profile_completion_percent = models.IntegerField(default=0)
    is_online = models.BooleanField(default=False, db_index=True)
    
    # Phase 1: Centralized location tracking
    current_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rider_current_users',
        help_text="Rider's real-time current location"
    )
    address = models.TextField(blank=True, null=True, help_text="Rider service area address")
    current_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, help_text="Current latitude for distance calculations")
    current_longitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, help_text="Current longitude for distance calculations")
    location_accuracy = models.FloatField(default=0, help_text="GPS accuracy in meters")
    last_location_update = models.DateTimeField(null=True, blank=True, help_text="Last timestamp of location update")
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_deliveries = models.IntegerField(default=0)
    acceptance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    on_time_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Phase 6: Suspension & Performance
    suspension_start_date = models.DateTimeField(null=True, blank=True)  # When suspended
    warning_issued_at = models.DateTimeField(null=True, blank=True)  # When warning sent
    suspension_reason = models.TextField(blank=True, null=True)  # Why suspended
    
    # Phase 7: Push Notifications
    fcm_token = models.CharField(max_length=500, blank=True, null=True, db_index=True, help_text="Firebase Cloud Messaging token for push notifications")
    fcm_token_updated_at = models.DateTimeField(null=True, blank=True, help_text="Last time FCM token was updated")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.full_name} ({self.user.username})"
    
    def calculate_profile_completion(self):
        """Calculate profile completion percentage"""
        completion = 0
        if self.phone_verified:
            completion += 25
        if self.documents.filter(status='approved').exists():
            completion += 25
        if self.vehicle_type and self.vehicle_plate_number:
            completion += 25
        if hasattr(self, 'bank_details'):
            completion += 25
        self.profile_completion_percent = completion
        return completion
    
    class Meta:
        verbose_name = 'Rider Profile'
        verbose_name_plural = 'Rider Profiles'


class RiderLocation(models.Model):
    """
    Phase 4: Real-time rider location tracking
    Stores current and historical location data for active deliveries
    """
    rider = models.OneToOneField(
        RiderProfile,
        on_delete=models.CASCADE,
        related_name='current_location_data',
        help_text="Rider's location record"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=False,  # Must have value
        help_text="Current latitude"
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=False,  # Must have value
        help_text="Current longitude"
    )
    accuracy = models.FloatField(
        default=0,
        help_text="GPS accuracy in meters"
    )
    current_order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rider_location_updates',
        help_text="Order being delivered (if any)"
    )
    is_tracking = models.BooleanField(
        default=False,
        help_text="Whether actively tracking this rider"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last location update timestamp"
    )
    
    class Meta:
        verbose_name = 'Rider Location'
        verbose_name_plural = 'Rider Locations'
        indexes = [
            models.Index(fields=['rider', 'updated_at']),
            models.Index(fields=['is_tracking']),
        ]
    
    def __str__(self):
        return f"{self.rider.full_name} @ ({self.latitude}, {self.longitude})"


class RiderDocument(models.Model):
    """For KYC and verification"""
    DOCUMENT_CHOICES = [
        ('id_card', 'ID Card'),
        ('driver_license', 'Driver License'),
        ('student_id', 'Student ID'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_CHOICES)
    file = models.FileField(upload_to='rider_documents/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    expiry_date = models.DateField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_by_admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_rider_documents')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.rider.full_name} - {self.document_type}"
    
    class Meta:
        verbose_name = 'Rider Document'
        verbose_name_plural = 'Rider Documents'


class RiderWallet(models.Model):
    """For earnings management"""
    rider = models.OneToOneField(RiderProfile, on_delete=models.CASCADE, related_name='wallet')
    available_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Can withdraw
    pending_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)   # 24hr hold
    total_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_payout_date = models.DateTimeField(null=True, blank=True)
    last_withdrawal_date = models.DateTimeField(null=True, blank=True)  # For withdrawal cooldown
    is_frozen = models.BooleanField(default=False)  # Admin can freeze for fraud investigation
    frozen_reason = models.TextField(blank=True, null=True)
    frozen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Wallet - {self.rider.full_name} (₦{self.available_balance})"
    
    class Meta:
        verbose_name = 'Rider Wallet'
        verbose_name_plural = 'Rider Wallets'


class RiderTransaction(models.Model):
    """Every earning or payout must be recorded"""
    TRANSACTION_CHOICES = [
        ('delivery_earning', 'Delivery Earning'),
        ('bonus', 'Bonus'),
        ('penalty', 'Penalty'),
        ('withdrawal', 'Withdrawal'),
        ('adjustment', 'Admin Adjustment'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='rider_transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True, null=True)
    admin_note = models.TextField(blank=True, null=True)  # For admin adjustments
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.transaction_type} - ₦{self.amount} ({self.rider.full_name})"
    
    class Meta:
        verbose_name = 'Rider Transaction'
        verbose_name_plural = 'Rider Transactions'
        ordering = ['-created_at']


class RiderRating(models.Model):
    """Ratings from buyers or sellers"""
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='ratings')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='rider_ratings')
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    rated_by = models.CharField(max_length=20, choices=[('buyer', 'Buyer'), ('seller', 'Seller')])
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.rating}★ for {self.rider.full_name} - Order #{self.order.id}"
    
    class Meta:
        verbose_name = 'Rider Rating'
        verbose_name_plural = 'Rider Ratings'
        unique_together = ('order', 'rider', 'rated_by')


class RiderOrder(models.Model):
    """Bridge model - tracks rider assignment lifecycle for each order"""
    STATUS_CHOICES = [
        ('assigned_pending', 'Assigned - Pending Response'),  # Initial assignment, waiting for rider to accept
        ('accepted', 'Accepted'),                              # Rider accepted the order
        ('arrived_at_location', 'Arrived at Pickup'),          # Rider arrived at restaurant
        ('picked_up', 'Picked Up'),                            # Rider confirmed pickup
        ('completed', 'Completed'),                            # Delivery completed
        ('rejected', 'Rejected'),                              # Rider rejected
        ('timeout', 'Timeout'),                                # Rider didn't respond in 30 seconds
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='rider_assignments')
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='order_assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned_pending')
    assigned_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)  # When rider accepted/rejected
    arrived_at = models.DateTimeField(null=True, blank=True)    # When rider arrived
    picked_up_at = models.DateTimeField(null=True, blank=True)  # When rider picked up
    completed_at = models.DateTimeField(null=True, blank=True)  # When delivered
    distance_at_assignment = models.FloatField(null=True, blank=True)
    assignment_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"Order #{self.order.id} - {self.rider.full_name} ({self.status})"
    
    class Meta:
        verbose_name = 'Rider Order'
        verbose_name_plural = 'Rider Orders'
        ordering = ['-assigned_at']


class RiderBankDetails(models.Model):
    """Secure bank details storage for rider payouts"""
    rider = models.OneToOneField(RiderProfile, on_delete=models.CASCADE, related_name='bank_details')
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=150)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.rider.full_name} - {self.bank_name}"
    
    class Meta:
        verbose_name = 'Rider Bank Details'
        verbose_name_plural = 'Rider Bank Details'


class RiderServiceArea(models.Model):
    """Service areas/zones that a rider can deliver in"""
    AREA_CHOICES = [
        ('lekki', 'Lekki'),
        ('ikoyi', 'Ikoyi'),
        ('vi', 'Victoria Island'),
        ('yaba', 'Yaba'),
        ('ikeja', 'Ikeja'),
        ('surulere', 'Surulere'),
        ('mushin', 'Mushin'),
        ('apapa', 'Apapa'),
        ('bariga', 'Bariga'),
        ('mainland', 'Mainland'),
    ]
    
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='service_areas')
    area_code = models.CharField(max_length=50, choices=AREA_CHOICES)
    area_name = models.CharField(max_length=100)
    is_selected = models.BooleanField(default=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.rider.full_name} - {self.area_name}"
    
    class Meta:
        verbose_name = 'Rider Service Area'
        verbose_name_plural = 'Rider Service Areas'
        unique_together = ('rider', 'area_code')
        ordering = ['added_at']


class RiderOTP(models.Model):
    """OTP for phone number verification"""
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='otps')
    phone_number = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"OTP for {self.phone_number}"
    
    class Meta:
        verbose_name = 'Rider OTP'
        verbose_name_plural = 'Rider OTPs'
        ordering = ['-created_at']


class PayoutRequest(models.Model):
    """Payout/Withdrawal request from rider"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Bank snapshot - store details at time of request
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    account_name = models.CharField(max_length=150, blank=True)
    
    # Admin actions
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payouts')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    completed_at = models.DateTimeField(null=True, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payout ₦{self.amount} - {self.rider.full_name} ({self.status})"
    
    class Meta:
        verbose_name = 'Payout Request'
        verbose_name_plural = 'Payout Requests'
        ordering = ['-requested_at']


class Dispute(models.Model):
    """Disputes for orders - buyer/seller/rider can lodge"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]
    
    REASON_CHOICES = [
        ('quality_issue', 'Quality Issue'),
        ('delivery_delay', 'Delivery Delay'),
        ('incomplete_order', 'Incomplete Order'),
        ('wrong_order', 'Wrong Order Delivered'),
        ('rider_misconduct', 'Rider Misconduct'),
        ('seller_issue', 'Seller Issue'),
        ('other', 'Other'),
    ]
    
    DECISION_CHOICES = [
        ('full_refund', 'Full Refund'),
        ('partial_refund', 'Partial Refund'),
        ('no_action', 'No Action'),
        ('rider_penalty', 'Rider Penalty'),
        ('seller_penalty', 'Seller Penalty'),
        ('pending', 'Pending Admin Decision'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='disputes')
    lodged_by_type = models.CharField(max_length=20, choices=[('buyer', 'Buyer'), ('seller', 'Seller'), ('rider', 'Rider')])
    lodged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='disputes_lodged')
    
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField()
    evidence_photo = models.ImageField(upload_to='dispute_evidence/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_decision = models.CharField(max_length=30, choices=DECISION_CHOICES, default='pending')
    admin_note = models.TextField(blank=True, null=True)
    
    # Refund info if applicable
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refund_reason = models.TextField(blank=True, null=True)
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    
    # Penalty info if applicable
    penalty_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    penalty_type = models.CharField(max_length=50, blank=True, null=True)  # 'rider_penalty', 'seller_penalty'
    
    # Timeline
    lodged_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='disputes_reviewed')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Dispute - Order #{self.order.id} ({self.status})"
    
    class Meta:
        verbose_name = 'Dispute'
        verbose_name_plural = 'Disputes'
        ordering = ['-lodged_at']


# ============================================================================
# PHASE 7: REAL-TIME INFRASTRUCTURE - LOCATION TRACKING
# ============================================================================




class RiderNotification(models.Model):
    """
    Push notifications for Phase 7
    Tracks delivery assignments, status changes, payouts
    """
    NOTIFICATION_TYPES = [
        ('assignment', 'Order Assigned'),
        ('status_update', 'Order Status Update'),
        ('pickup', 'Order Picked Up'),
        ('delivery', 'Order Delivered'),
        ('payout', 'Payout Approved'),
        ('dispute', 'Dispute Update'),
        ('suspension', 'Account Suspension'),
        ('warning', 'Performance Warning'),
    ]
    
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Push notification tracking
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Data payload for app
    data = models.JSONField(default=dict, blank=True)
    
    # Firebase FCM token for push
    fcm_token = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Rider Notification'
        verbose_name_plural = 'Rider Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rider', 'is_read']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.rider.full_name}"

