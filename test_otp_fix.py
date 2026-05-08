#!/usr/bin/env python
"""
Test script to verify OTP fixes
Run with: python test_otp_fix.py
"""
import os
import django
import sys

# Add project to path
sys.path.insert(0, 'd:/Dleva/dleva')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Setup Django
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from buyer.models import BuyerOTP
from django.contrib.auth.models import User
import json

client = APIClient()

def test_phone_otp_flow():
    """Test complete phone OTP verification flow"""
    print("\n" + "="*60)
    print("TESTING PHONE OTP FLOW")
    print("="*60)
    
    phone_number = "+2348012345678"
    
    # Step 1: Request OTP
    print("\n1. Requesting phone OTP...")
    response = client.post('/api/buyer/request-phone-otp/', {
        'phone_number': phone_number
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ FAILED: Could not request phone OTP")
        return False
    
    # Check if OTP record was created in database
    try:
        otp_record = BuyerOTP.objects.get(
            phone_number=phone_number,
            purpose='verify_phone',
            is_verified=False
        )
        print(f"✓ OTP record created: {otp_record.otp_code}")
        otp_code = otp_record.otp_code
    except BuyerOTP.DoesNotExist:
        print("❌ FAILED: OTP record not found in database")
        return False
    
    # Step 2: Verify OTP
    print("\n2. Verifying phone OTP...")
    response = client.post('/api/buyer/verify-phone-otp/', {
        'phone_number': phone_number,
        'otp_code': otp_code
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ FAILED: Could not verify phone OTP")
        return False
    
    # Check if OTP is marked as verified
    otp_record = BuyerOTP.objects.get(
        phone_number=phone_number,
        purpose='verify_phone'
    )
    if otp_record.is_verified:
        print("✓ OTP marked as verified in database")
    else:
        print("❌ FAILED: OTP not marked as verified")
        return False
    
    print("\n✓ Phone OTP flow completed successfully!")
    return True

def test_email_otp_flow():
    """Test complete email OTP verification flow"""
    print("\n" + "="*60)
    print("TESTING EMAIL OTP FLOW")
    print("="*60)
    
    email = "test@example.com"
    
    # Step 1: Request OTP
    print("\n1. Requesting email OTP...")
    response = client.post('/api/buyer/request-email-otp/', {
        'email': email
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ FAILED: Could not request email OTP")
        return False
    
    # Check if OTP record was created in database
    try:
        otp_record = BuyerOTP.objects.get(
            phone_number=email,  # Email stored in phone_number field
            purpose='registration',
            is_verified=False
        )
        print(f"✓ OTP record created: {otp_record.otp_code}")
        otp_code = otp_record.otp_code
    except BuyerOTP.DoesNotExist:
        print("❌ FAILED: OTP record not found in database")
        return False
    
    # Step 2: Verify OTP
    print("\n2. Verifying email OTP...")
    response = client.post('/api/buyer/verify-email-otp/', {
        'email': email,
        'otp_code': otp_code
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code != 200:
        print("❌ FAILED: Could not verify email OTP")
        return False
    
    # Check if OTP is marked as verified
    otp_record = BuyerOTP.objects.get(
        phone_number=email,
        purpose='registration'
    )
    if otp_record.is_verified:
        print("✓ OTP marked as verified in database")
    else:
        print("❌ FAILED: OTP not marked as verified")
        return False
    
    print("\n✓ Email OTP flow completed successfully!")
    return True

if __name__ == '__main__':
    print("\n🔍 Testing OTP Flow Fixes\n")
    
    phone_result = test_phone_otp_flow()
    email_result = test_email_otp_flow()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Phone OTP: {'✓ PASS' if phone_result else '❌ FAIL'}")
    print(f"Email OTP: {'✓ PASS' if email_result else '❌ FAIL'}")
    print("="*60 + "\n")
