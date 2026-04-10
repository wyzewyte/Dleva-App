from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from .models import BuyerProfile, BuyerOTP
from .serializers import BuyerProfileSerializer
from utils.twilio_service import TwilioService
from utils.password_reset_service import create_password_reset_service, PasswordResetOTPService
from datetime import timedelta
import random
import string

# Initialize OTP verification service for buyers
# BuyerProfile uses 'phone' field (not 'phone_number')
buyer_otp_service = create_password_reset_service(
    BuyerProfile,
    BuyerOTP,
    profile_field_name='buyer',
    profile_phone_field='phone',  # BuyerProfile uses 'phone' field
    purpose='password_reset'
)

# Separate service for profile updates
buyer_profile_update_otp_service = create_password_reset_service(
    BuyerProfile,
    BuyerOTP,
    profile_field_name='buyer',
    profile_phone_field='phone',
    purpose='update_profile'  # Mark as profile update purpose
)

@api_view(['POST']) 
@permission_classes([AllowAny])
def register_buyer(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name')  # Add name field

    if not username or not email or not password or not name:
        return Response({
            'error': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({
            'error': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create user
    user = User.objects.create_user(
        username=username, 
        email=email, 
        password=password,
        first_name=name.split()[0],  # First name
        last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
    )

    # Create buyer profile
    BuyerProfile.objects.create(user=user)

    # Generate tokens
    refresh = RefreshToken.for_user(user)

    return Response({
        'message': 'Registration successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': user.get_full_name() or user.username,
        },
        'refresh': str(refresh),
        'access': str(refresh.access_token)
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_buyer(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is not None:
        try:
            buyer_profile = BuyerProfile.objects.get(user=user)
        except BuyerProfile.DoesNotExist:
            if hasattr(user, 'seller_profile'):
                return Response({
                    'error': 'This account is registered as a seller. Please use the seller login page.'
                }, status=status.HTTP_403_FORBIDDEN)

            if hasattr(user, 'rider_profile'):
                return Response({
                    'error': 'This account is registered as a rider. Please use the rider login page.'
                }, status=status.HTTP_403_FORBIDDEN)

            return Response({
                'error': 'This account is not registered as a buyer.'
            }, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login Successful',
            'user': {  # ✅ Return user object, not just username
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'phone': buyer_profile.phone,
                'address': buyer_profile.address,
            },
            'refresh': str(refresh), 
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Invalid Credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


# ============================================================================
# PASSWORD RESET - Using PasswordResetOTPService for clean, reusable flows
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_buyer(request):
    """
    Request password reset OTP for a buyer
    
    Requires: phone_number (buyer's phone)
    Returns: OTP sent to phone (in DEBUG mode)
    """
    phone_number = request.data.get('phone_number')
    result = buyer_otp_service.request_password_reset(phone_number)
    
    # Check if successful
    if not result.get('success', False):
        return Response({'error': result.get('error', 'Failed to send code')}, status=result.get('code', status.HTTP_400_BAD_REQUEST))
    
    response = {
        'message': result['message'],
        'phone': result['phone'],
        'expires_in_minutes': result.get('expires_in_minutes', 10)
    }
    
    # Include debug OTP in development mode
    if settings.DEBUG and 'debug_otp' in result:
        response['debug_otp'] = result['debug_otp']
    
    return Response(response, status=result['code'])


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code_buyer(request):
    """
    Verify OTP code for password reset
    
    Requires: phone_number, code (OTP)
    Returns: Reset token for next step
    """
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('code') or request.data.get('otp_code')
    
    result = buyer_otp_service.verify_reset_code(phone_number, otp_code)
    
    if not result['success']:
        return Response({'error': result['error']}, status=result['code'])
    
    return Response({
        'message': result['message'],
        'phone': phone_number,
        'verified': result['verified']
    }, status=result['code'])


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_buyer(request):
    """
    Reset buyer password after OTP verification
    
    Requires: phone_number, code (OTP), password (new password)
    Returns: Success message
    """
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('code') or request.data.get('otp_code')
    new_password = request.data.get('password')
    
    result = buyer_otp_service.reset_password(phone_number, otp_code, new_password)
    
    if not result['success']:
        return Response({'error': result['error']}, status=result['code'])
    
    return Response({
        'message': result['message'],
        'success': result['success']
    }, status=result['code'])


# ============================================================================
# PROFILE UPDATE OTP VERIFICATION - For secure profile changes
# ============================================================================
# For profile updates, we need custom OTP handling since the user is creating a NEW phone number entry
# (not looking up an existing profile by phone like password reset does)

def _generate_otp():
    """Generate a random 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def _normalize_phone(phone_number):
    """Normalize phone number"""
    if not phone_number:
        return None
    return str(phone_number).strip().replace(' ', '')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_profile_update_otp(request):
    """
    Request OTP for profile update verification
    Requires: phone_number (the phone to verify)
    Returns: Success message with expires_in_minutes
    
    Note: This is different from password reset OTP because we're verifying a NEW phone number
    that doesn't have a profile in the database yet
    """
    try:
        buyer = BuyerProfile.objects.get(user=request.user)
    except BuyerProfile.DoesNotExist:
        return Response(
            {'error': 'Buyer profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    phone_number = request.data.get('phone_number')
    phone_number = _normalize_phone(phone_number)
    
    if not phone_number:
        return Response(
            {'error': 'Phone number is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate and save OTP (directly, not using service since we're creating a NEW phone entry)
    otp_code = _generate_otp()
    otp_expiry_minutes = 10
    
    otp_data = {
        'buyer': buyer,
        'phone_number': phone_number,
        'otp_code': otp_code,
        'purpose': 'update_profile',
        'expires_at': timezone.now() + timedelta(minutes=otp_expiry_minutes)
    }
    BuyerOTP.objects.create(**otp_data)
    
    # Send OTP via SMS (this WILL print to terminal in DEBUG mode)
    TwilioService.send_otp_sms(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='update_profile'
    )
    
    return Response({
        'success': True,
        'message': 'OTP sent to your phone',
        'phone': phone_number,
        'expires_in_minutes': otp_expiry_minutes
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_profile_update_otp(request):
    """
    Verify OTP for profile update
    Requires: phone_number, code (OTP)
    Returns: verified confirmation
    """
    try:
        buyer = BuyerProfile.objects.get(user=request.user)
    except BuyerProfile.DoesNotExist:
        return Response(
            {'error': 'Buyer profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('code')
    
    phone_number = _normalize_phone(phone_number)
    
    if not phone_number or not otp_code:
        return Response(
            {'error': 'Phone number and code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        otp = BuyerOTP.objects.filter(
            buyer=buyer,
            phone_number=phone_number,
            purpose='update_profile'
        ).latest('created_at')
    except BuyerOTP.DoesNotExist:
        return Response(
            {'error': 'No verification code found. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if expired
    if otp.expires_at < timezone.now():
        return Response(
            {'error': 'Verification code has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check attempts
    max_attempts = 3
    if otp.attempts >= max_attempts:
        otp.delete()
        return Response(
            {'error': 'Too many failed attempts. Please request a new code.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify code
    if otp.otp_code != otp_code:
        otp.attempts += 1
        otp.save()
        remaining = max_attempts - otp.attempts
        return Response(
            {'error': f'Invalid code. {remaining} attempts remaining.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark as verified
    otp.is_verified = True
    otp.save()
    
    return Response({
        'success': True,
        'message': 'Phone verified successfully',
        'phone': phone_number,
        'verified': True
    }, status=status.HTTP_200_OK)
