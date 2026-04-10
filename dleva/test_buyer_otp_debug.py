#!/usr/bin/env python
"""
Quick test to verify buyer OTP prints to terminal
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from utils.password_reset_service import create_password_reset_service
from buyer.models import BuyerProfile, BuyerOTP
from django.conf import settings

print(f"\n{'='*70}")
print(f"Testing Buyer OTP Console Output")
print(f"DEBUG Mode: {settings.DEBUG}")
print(f"{'='*70}\n")

# Create the same service instance used in auth_views.py
buyer_profile_update_otp_service = create_password_reset_service(
    BuyerProfile,
    BuyerOTP,
    profile_field_name='buyer',
    profile_phone_field='phone',
    purpose='update_profile'
)

# Test with a test phone number (won't find a profile, but should still print)
print("Sending test OTP request to: +234 806 123 4567\n")
result = buyer_profile_update_otp_service.request_password_reset('+234 806 123 4567')

print(f"\nResult: {result}")
print(f"Expected: OTP printed to terminal above")
