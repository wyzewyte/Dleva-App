"""
Centralized Location Models and Validators
This is the single source of truth for all location data in the backend.
"""
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db.models import Q
from decimal import Decimal
import math


class Location(models.Model):
    """
    Represents a geographic location (address + coordinates).
    Can be reused across buyers, riders, restaurants, etc.
    Uses DecimalField with 8 decimal precision for better accuracy.
    """
    address = models.CharField(
        max_length=500, 
        help_text="Human-readable address (e.g., '123 Lekki Road, Lagos')"
    )
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8,
        help_text="Latitude coordinate (8 decimal precision = ~1.1mm accuracy)"
    )
    longitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8,
        help_text="Longitude coordinate (8 decimal precision = ~1.1mm accuracy)"
    )
    
    # Metadata for reference
    city = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    area = models.CharField(max_length=100, blank=True, null=True,  db_index=True)
    
    # Audit timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Location'
        verbose_name_plural = 'Locations'
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['city', 'area']),
        ]
    
    def __str__(self):
        return f"{self.address} ({self.latitude}, {self.longitude})"
    
    def distance_to(self, other_location):
        """
        Calculate distance to another location using Haversine formula.
        Returns distance in kilometers.
        """
        if not isinstance(other_location, Location):
            raise ValueError("other_location must be a Location instance")
        
        lat1 = float(self.latitude)
        lon1 = float(self.longitude)
        lat2 = float(other_location.latitude)
        lon2 = float(other_location.longitude)
        
        # Haversine formula
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        
        return round(R * c, 2)
    
    def clean(self):
        """Validate location coordinates"""
        if self.latitude < -90 or self.latitude > 90:
            raise ValidationError("Latitude must be between -90 and 90")
        if self.longitude < -180 or self.longitude > 180:
            raise ValidationError("Longitude must be between -180 and 180")


class LocationHistory(models.Model):
    """
    Tracks all location changes for fraud detection and analytics.
    Use for: Riders (real-time tracking), Buyers (address history), Sellers (relocation history).
    """
    LOCATION_TYPE_CHOICES = [
        ('rider_current', 'Rider Current Location'),
        ('buyer_delivery', 'Buyer Delivery Address'),
        ('buyer_home', 'Buyer Home Address'),
        ('seller_restaurant', 'Seller Restaurant Location'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='location_history', db_index=True)
    location_type = models.CharField(max_length=30, choices=LOCATION_TYPE_CHOICES, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.DO_NOTHING, related_name='history')
    
    # Previous location for validation
    previous_location = models.ForeignKey(
        Location, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='history_previous'
    )
    
    # Metadata
    distance_from_previous = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Distance from previous location in km"
    )
    time_since_previous_minutes = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Time elapsed since previous location in minutes"
    )
    
    # Validation flags for fraud detection
    is_validated = models.BooleanField(default=False)
    validation_status = models.CharField(
        max_length=50,
        choices=[
            ('clean', 'Clean - No Issues'),
            ('suspicious', 'Suspicious - Unusual Jump'),
            ('blocked', 'Blocked - Possible Spoofing'),
        ],
        default='clean'
    )
    validation_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name = 'Location History'
        verbose_name_plural = 'Location Histories'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['location_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.location_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def validate_location_jump(self):
        """
        Validate if this location change is legitimate.
        Returns (is_valid, reason).
        
        Rules:
        - Riders: Can't jump >100km in <1 minute (spoofing detection)
        - Riders: Can't teleport >500km in <1 hour
        - Buyers: Can change location anywhere (checkout flexibility)
        """
        if not self.previous_location:
            self.is_validated = True
            self.validation_status = 'clean'
            return True, "First location"
        
        distance = self.distance_from_previous
        time_minutes = self.time_since_previous_minutes
        
        if not distance or not time_minutes:
            return True, "No time/distance data"
        
        # Rider-specific validation
        if self.location_type == 'rider_current':
            # Impossible speed: >100km in 1 minute = 6000km/h (impossible)
            if distance and time_minutes and distance > 100 and time_minutes < 1:
                return False, f"Impossible speed: {distance}km in {time_minutes}min"
            
            # Extreme distance in short time: >500km in 1 hour
            if distance and time_minutes and distance > 500 and time_minutes <= 60:
                return False, f"Extreme jump: {distance}km in {time_minutes}min"
            
            # Max reasonable speed: ~200km/h (consider highways)
            max_distance = Decimal(200 * (time_minutes or 1) / 60)  # 200km/h max
            if distance and distance > max_distance:
                return False, f"Speed violation: Traveled {distance}km in {time_minutes}min"
        
        return True, "Location valid"


class LocationValidator:
    """
    Centralized location validation service.
    Use this for all location-related validation logic.
    """
    
    # Geofence limits (customize based on your service area)
    VALID_LAT_MIN = Decimal('3.0')  # Southern boundary
    VALID_LAT_MAX = Decimal('14.0')  # Northern boundary
    VALID_LON_MIN = Decimal('2.0')  # Western boundary
    VALID_LON_MAX = Decimal('15.0')  # Eastern boundary
    
    # Spoofing detection thresholds
    MAX_RIDER_SPEED_KMH = Decimal('200')  # Max realistic speed
    MAX_RIDER_JUMP_KM = Decimal('100')   # Max single jump
    MIN_TIME_BETWEEN_UPDATES_SECONDS = 10
    
    @staticmethod
    def validate_coordinates(latitude, longitude):
        """
        Validate raw latitude/longitude inputs.
        Returns (is_valid, error_message).
        """
        try:
            lat = Decimal(str(latitude))
            lon = Decimal(str(longitude))
        except:
            return False, "Invalid coordinate format"
        
        if lat < -90 or lat > 90:
            return False, "Latitude must be between -90 and 90"
        
        if lon < -180 or lon > 180:
            return False, "Longitude must be between -180 and 180"
        
        # Check if within service area (customize for your region)
        if not (LocationValidator.VALID_LAT_MIN <= lat <= LocationValidator.VALID_LAT_MAX):
            return False, f"Latitude {lat} outside service area"
        
        if not (LocationValidator.VALID_LON_MIN <= lon <= LocationValidator.VALID_LON_MAX):
            return False, f"Longitude {lon} outside service area"
        
        return True, None
    
    @staticmethod
    def validate_location_change(user, location_type, new_location, previous_location=None, time_since_previous=None):
        """
        Validate a location change for the given user.
        Returns (is_valid, status, reason).
        
        status can be: 'clean', 'suspicious', 'blocked'
        """
        if not previous_location:
            return True, 'clean', 'First location'
        
        # Calculate distance
        distance = previous_location.distance_to(new_location)
        
        # Rider validation
        if location_type == 'rider_current':
            if not time_since_previous:
                return False, 'blocked', 'Missing time data'
            
            time_minutes = time_since_previous / 60  # Convert to minutes
            
            # Impossible physics check
            if distance > 100 and time_minutes < 1:
                return False, 'blocked', 'GPS spoofing detected: impossible speed'
            
            # Speed check
            max_distance = float(LocationValidator.MAX_RIDER_SPEED_KMH) * (time_minutes / 60)
            if distance > max_distance:
                return True, 'suspicious', f'Unusual speed: {distance:.2f}km in {time_minutes:.1f} minutes'
        
        return True, 'clean', 'Valid location change'
    
    @staticmethod
    def get_service_area_bounds():
        """Return the bounding box of your service area"""
        return {
            'lat_min': float(LocationValidator.VALID_LAT_MIN),
            'lat_max': float(LocationValidator.VALID_LAT_MAX),
            'lon_min': float(LocationValidator.VALID_LON_MIN),
            'lon_max': float(LocationValidator.VALID_LON_MAX),
        }


class DeliveryPricingConfig(models.Model):
    """
    Active delivery pricing configuration.
    The active row is the single source of truth for buyer fees, rider pay,
    and platform margin.
    """
    buyer_base_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('500.00'),
        help_text='Flat fee charged to the buyer up to the base distance',
    )
    buyer_per_km_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('100.00'),
        help_text='Amount charged to the buyer per km beyond the base distance',
    )
    rider_base_pay = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('300.00'),
        help_text='Flat pay earned by the rider up to the base distance',
    )
    rider_per_km_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('60.00'),
        help_text='Amount earned by the rider per km beyond the base distance',
    )
    base_distance_km = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('3.00'),
        help_text='Distance threshold before per-km rates kick in',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Only one config can be active at a time',
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text='Internal notes about this pricing config',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Delivery Pricing Config'
        verbose_name_plural = 'Delivery Pricing Configs'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['is_active'],
                condition=Q(is_active=True),
                name='unique_active_delivery_pricing_config',
            )
        ]

    def __str__(self):
        status = 'active' if self.is_active else 'inactive'
        return f'Delivery pricing config #{self.pk or "new"} ({status})'

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.is_active:
                DeliveryPricingConfig.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
            super().save(*args, **kwargs)

    @classmethod
    def get_active(cls):
        config = cls.objects.filter(is_active=True).order_by('-created_at').first()
        if config:
            return config
        return cls.objects.create(is_active=True)

    def calculate_for_distance(self, distance_km):
        distance = Decimal(str(distance_km or 0))
        extra_km = max(Decimal('0.00'), distance - self.base_distance_km)
        buyer_fee = self.buyer_base_fee + (extra_km * self.buyer_per_km_rate)
        rider_pay = self.rider_base_pay + (extra_km * self.rider_per_km_rate)
        platform_margin = buyer_fee - rider_pay

        return {
            'distance_km': distance.quantize(Decimal('0.01')),
            'base_distance_km': self.base_distance_km,
            'extra_km': extra_km.quantize(Decimal('0.01')),
            'buyer_fee': buyer_fee.quantize(Decimal('0.01')),
            'rider_pay': rider_pay.quantize(Decimal('0.01')),
            'platform_margin': platform_margin.quantize(Decimal('0.01')),
        }
