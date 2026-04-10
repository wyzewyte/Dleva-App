"""
Generic Password Reset Service
Reusable for Riders, Buyers, and Sellers

This module provides a base class for password reset OTP flows,
making it easy to extend password reset functionality to different user types.

Usage:
    # For Riders
    rider_service = PasswordResetOTPService(RiderProfile, RiderOTP, purpose='password_reset')
    rider_service.request_reset('phone_number')
    rider_service.verify_code('phone_number', 'otp_code')
    rider_service.reset_password('phone_number', 'otp_code', 'new_password')
"""

from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import status
from utils.twilio_service import TwilioService
import random
import string


class PasswordResetOTPService:
    """
    Base service for handling password reset via OTP
    
    To use for a new user type:
    1. Create an OTP model similar to RiderOTP with a 'purpose' field
    2. Create a Profile model for the user type
    3. Instantiate this service with your models and the correct profile field name
    """

    def __init__(self, profile_model, otp_model, purpose='password_reset', profile_field_name='profile', profile_phone_field='phone_number'):
        """
        Initialize the password reset service

        Args:
            profile_model: The profile model (e.g., RiderProfile, BuyerProfile)
            otp_model: The OTP model (e.g., RiderOTP, BuyerOTP)
            purpose: Purpose identifier for OTP filtering (default: 'password_reset')
            profile_field_name: Field name in OTP model (e.g., 'rider', 'buyer', 'seller', 'profile')
            profile_phone_field: Field name in profile model for phone (e.g., 'phone_number' for Rider, 'phone' for Buyer)
        """
        self.profile_model = profile_model
        self.otp_model = otp_model
        self.purpose = purpose
        self.profile_field_name = profile_field_name  # Field name in OTP model
        self.profile_phone_field = profile_phone_field  # Field name in profile model for phone
        self.max_attempts = 3
        self.otp_expiry_minutes = 10

    @staticmethod
    def _generate_otp():
        """Generate a random 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=6))

    @staticmethod
    def _normalize_phone(phone_number):
        """Normalize phone number"""
        if phone_number is None:
            return None
        return str(phone_number).strip().replace(' ', '')

    def request_password_reset(self, phone_number):
        """
        Request password reset OTP

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'phone': str,
                'debug_otp': str (only in DEBUG mode)
            }
        """
        phone_number = self._normalize_phone(phone_number)

        if not phone_number:
            return {
                'success': False,
                'error': 'Phone number is required',
                'code': status.HTTP_400_BAD_REQUEST
            }

        try:
            # Find profile by phone number using dynamic field name
            filter_kwargs = {self.profile_phone_field: phone_number}
            profile = self.profile_model.objects.get(**filter_kwargs)
        except self.profile_model.DoesNotExist:
            # Return error if phone number not registered
            return {
                'success': False,
                'error': 'Phone number is not registered',
                'code': status.HTTP_404_NOT_FOUND
            }

        # Generate and save OTP
        otp_code = self._generate_otp()
        otp_data = {
            self.profile_field_name: profile,  # Use dynamic field name (rider, buyer, seller, profile)
            'phone_number': phone_number,
            'otp_code': otp_code,
            'purpose': self.purpose,  # Mark as password reset
            'expires_at': timezone.now() + timedelta(minutes=self.otp_expiry_minutes)
        }
        self.otp_model.objects.create(**otp_data)

        # Send OTP via SMS
        TwilioService.send_otp_sms(
            phone_number=phone_number,
            otp_code=otp_code,
            purpose=self.purpose
        )

        return {
            'success': True,
            'message': 'If an account exists with this phone, a code will be sent',
            'phone': phone_number,
            'code': status.HTTP_200_OK,
            'expires_in_minutes': self.otp_expiry_minutes
        }

    def verify_reset_code(self, phone_number, otp_code):
        """
        Verify password reset OTP

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'verified': bool,
                'error': str (if failed)
            }
        """
        phone_number = self._normalize_phone(phone_number)

        if not phone_number or not otp_code:
            return {
                'success': False,
                'error': 'Phone number and code are required',
                'code': status.HTTP_400_BAD_REQUEST
            }

        try:
            otp = self.otp_model.objects.filter(
                phone_number=phone_number,
                purpose=self.purpose
            ).latest('created_at')
        except self.otp_model.DoesNotExist:
            return {
                'success': False,
                'error': 'No verification code found. Please request a new one.',
                'code': status.HTTP_400_BAD_REQUEST
            }

        # Check if expired
        if otp.expires_at < timezone.now():
            return {
                'success': False,
                'error': 'Verification code has expired. Please request a new one.',
                'code': status.HTTP_400_BAD_REQUEST
            }

        # Check attempts
        if otp.attempts >= self.max_attempts:
            otp.delete()
            return {
                'success': False,
                'error': 'Too many failed attempts. Please request a new code.',
                'code': status.HTTP_400_BAD_REQUEST
            }

        # Verify code
        if otp.otp_code != otp_code:
            otp.attempts += 1
            otp.save()
            remaining = self.max_attempts - otp.attempts
            return {
                'success': False,
                'error': f'Invalid code. {remaining} attempts remaining.',
                'code': status.HTTP_400_BAD_REQUEST
            }

        # Mark as verified
        otp.is_verified = True
        otp.save()

        return {
            'success': True,
            'message': 'Code verified. You can now reset your password.',
            'verified': True,
            'code': status.HTTP_200_OK
        }

    def reset_password(self, phone_number, otp_code, new_password):
        """
        Reset password after OTP verification

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'error': str (if failed)
            }
        """
        phone_number = self._normalize_phone(phone_number)

        if not phone_number or not otp_code or not new_password:
            return {
                'success': False,
                'error': 'Phone, code, and password are required',
                'code': status.HTTP_400_BAD_REQUEST
            }

        # Validate password strength
        if len(new_password) < 8:
            return {
                'success': False,
                'error': 'Password must be at least 8 characters',
                'code': status.HTTP_400_BAD_REQUEST
            }

        try:
            otp = self.otp_model.objects.filter(
                phone_number=phone_number,
                otp_code=otp_code,
                purpose=self.purpose,
                is_verified=True
            ).latest('created_at')
        except self.otp_model.DoesNotExist:
            return {
                'success': False,
                'error': 'Invalid or unverified code',
                'code': status.HTTP_400_BAD_REQUEST
            }

        # Check if expired
        if otp.expires_at < timezone.now():
            return {
                'success': False,
                'error': 'Code has expired. Please request a new one.',
                'code': status.HTTP_400_BAD_REQUEST
            }

        try:
            # Get the user and reset password
            # Use getattr to handle dynamic field name (rider, buyer, seller, profile)
            profile = getattr(otp, self.profile_field_name)
            user = profile.user
            user.set_password(new_password)
            user.save()

            # Delete used OTP
            otp.delete()

            return {
                'success': True,
                'message': 'Password reset successfully',
                'code': status.HTTP_200_OK
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to reset password: {str(e)}',
                'code': status.HTTP_500_INTERNAL_SERVER_ERROR
            }


# Quick factory function to create services for different user types
def create_password_reset_service(profile_model, otp_model, profile_field_name='profile', profile_phone_field='phone_number', purpose='password_reset'):
    """
    Factory function to create a password reset service

    Example:
        from rider.models import RiderProfile, RiderOTP
        rider_reset_service = create_password_reset_service(
            RiderProfile, RiderOTP, profile_field_name='rider', profile_phone_field='phone_number'
        )
        
        from buyer.models import BuyerProfile, BuyerOTP
        buyer_reset_service = create_password_reset_service(
            BuyerProfile, BuyerOTP, profile_field_name='buyer', profile_phone_field='phone'
        )
        
        # For profile updates
        buyer_profile_update_service = create_password_reset_service(
            BuyerProfile, BuyerOTP, profile_field_name='buyer', profile_phone_field='phone',
            purpose='update_profile'
        )
    """
    return PasswordResetOTPService(
        profile_model, 
        otp_model, 
        purpose=purpose,
        profile_field_name=profile_field_name,
        profile_phone_field=profile_phone_field
    )
