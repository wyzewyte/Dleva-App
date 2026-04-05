from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import RiderProfile, RiderDocument, RiderBankDetails, RiderOTP
from datetime import datetime, timedelta
import random


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)


class RiderRegistrationSerializer(serializers.Serializer):
    """Serializer for rider registration"""
    username = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(required=True, max_length=150)
    phone_number = serializers.CharField(required=True, max_length=20)
    vehicle_type = serializers.ChoiceField(choices=['bike', 'bicycle', 'car'])
    vehicle_plate_number = serializers.CharField(required=True, max_length=50)
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Check if username exists
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        
        # Check if email exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        
        return attrs
    
    def create(self, validated_data):
        """Create new user and rider profile"""
        # Create User
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['full_name'].split()[0],
            last_name=' '.join(validated_data['full_name'].split()[1:]) if len(validated_data['full_name'].split()) > 1 else ''
        )
        
        # Create RiderProfile
        rider_profile = RiderProfile.objects.create(
            user=user,
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            phone_number=validated_data['phone_number'],
            vehicle_type=validated_data['vehicle_type'],
            vehicle_plate_number=validated_data['vehicle_plate_number'],
            account_status='pending_documents',
            verification_status='pending',
            is_verified=False,
            phone_verified=False
        )
        
        return {
            'user': user,
            'rider_profile': rider_profile
        }


class RiderLoginSerializer(serializers.Serializer):
    """Serializer for rider login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        """Validate credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                raise serializers.ValidationError("Invalid credentials.")
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")
        
        attrs['user'] = user
        return attrs


class RiderOTPVerificationSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    phone_number = serializers.CharField(required=True, max_length=20)
    otp_code = serializers.CharField(required=True, max_length=6)
    
    def validate(self, attrs):
        """Validate OTP"""
        phone_number = attrs['phone_number']
        otp_code = attrs['otp_code']
        
        try:
            otp = RiderOTP.objects.filter(
                phone_number=phone_number,
                otp_code=otp_code,
                is_verified=False
            ).latest('created_at')
            
            # Check if OTP is expired
            if otp.expires_at < timezone.now():
                raise serializers.ValidationError("OTP has expired.")
            
            # Check attempts
            if otp.attempts >= 3:
                raise serializers.ValidationError("Maximum OTP attempts exceeded.")
            
            attrs['otp'] = otp
        except RiderOTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP.")
        
        return attrs


class RiderDocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for document upload"""
    class Meta:
        model = RiderDocument
        fields = ('document_type', 'file', 'expiry_date')
        
    def validate_file(self, value):
        """Validate file size and type"""
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 5MB.")
        
        return value


class RiderBankDetailsSerializer(serializers.ModelSerializer):
    """Serializer for bank details"""
    class Meta:
        model = RiderBankDetails
        fields = ('bank_code', 'bank_name', 'account_number', 'account_name')

    def validate_bank_code(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Bank code is required.")
        return value.strip()

    def validate_bank_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Bank name is required.")
        return value.strip()

    def validate_account_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Account name is required.")
        return value.strip()

    def validate_account_number(self, value):
        """Basic validation for account number"""
        if not value.isdigit():
            raise serializers.ValidationError("Account number must contain only digits.")
        
        if len(value) != 10:
            raise serializers.ValidationError("Account number must be exactly 10 digits.")
        
        return value


class RiderProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for rider profile updates"""
    username = serializers.CharField(required=False, max_length=150)

    class Meta:
        model = RiderProfile
        fields = ('username', 'full_name', 'phone_number', 'profile_photo', 'vehicle_type', 'vehicle_plate_number')
        
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not value.replace('+', '').replace(' ', '').isdigit():
            raise serializers.ValidationError("Invalid phone number format.")
        
        return value

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username cannot be empty.")

        rider = self.instance
        username_taken = User.objects.filter(username__iexact=value).exclude(id=rider.user_id).exists()
        rider_username_taken = RiderProfile.objects.filter(username__iexact=value).exclude(id=rider.id).exists()

        if username_taken or rider_username_taken:
            raise serializers.ValidationError("Username already exists.")

        return value

    def update(self, instance, validated_data):
        username = validated_data.pop('username', None)
        full_name = validated_data.get('full_name')

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if username is not None:
            instance.username = username
            instance.user.username = username
            instance.user.save(update_fields=['username'])

        if full_name is not None:
            name_parts = full_name.strip().split()
            instance.user.first_name = name_parts[0] if name_parts else ''
            instance.user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            instance.user.save(update_fields=['first_name', 'last_name'])

        instance.save()
        return instance



class RiderProfileSerializer(serializers.ModelSerializer):
    """Complete rider profile serializer"""
    user = UserSerializer(read_only=True)
    email = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = RiderProfile
        fields = (
            'id', 'user', 'username', 'full_name', 'email', 'phone_number', 'profile_photo',
            'vehicle_type', 'vehicle_plate_number', 'phone_verified',
            'account_status', 'verification_status', 'is_verified',
            'profile_completion_percent', 'is_online', 'average_rating',
            'total_deliveries', 'acceptance_rate', 'on_time_rate',
            'address', 'current_latitude', 'current_longitude', 'location_accuracy', 'last_location_update',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'profile_completion_percent', 'is_verified',
                           'average_rating', 'total_deliveries', 'current_latitude', 'current_longitude',
                           'location_accuracy', 'last_location_update', 'created_at', 'updated_at')
    
    def get_email(self, obj):
        """Get email from RiderProfile or fallback to User email"""
        # First try RiderProfile.email (if stored directly)
        if obj.email and obj.email.strip():
            return obj.email
        # Fallback to User.email (login email) - this is the primary source
        if obj.user and obj.user.email:
            return obj.user.email
        return None

    def get_username(self, obj):
        if obj.username and obj.username.strip():
            return obj.username
        if obj.user and obj.user.username:
            return obj.user.username
        return None


class RiderVerificationStatusSerializer(serializers.Serializer):
    """Serializer for rider verification status"""
    account_status = serializers.CharField()
    verification_status = serializers.CharField()
    phone_verified = serializers.BooleanField()
    documents_approved = serializers.BooleanField()
    bank_details_added = serializers.BooleanField()
    bank_details_verified = serializers.BooleanField()
    profile_completion_percent = serializers.IntegerField()
    is_online = serializers.BooleanField()



