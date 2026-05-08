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
from emails.notifications import send_buyer_otp_verification_email, send_buyer_password_reset_otp_email
from datetime import timedelta
import random
import string
import logging

logger = logging.getLogger(__name__)

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
def request_phone_otp(request):
    """
    Request OTP for phone verification during signup
    
    Requires: phone_number
    Returns: Message confirming OTP sent to phone
    """
    phone_number = request.data.get('phone_number')

    if not phone_number:
        return Response({
            'error': 'Phone number is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    phone_number = _normalize_phone(phone_number)

    # Generate OTP
    otp_code = _generate_otp()
    otp_expiry_minutes = 15
    expires_at = timezone.now() + timedelta(minutes=otp_expiry_minutes)

    # Create a temporary buyer profile entry for signup OTP (no user yet)
    # Try to find existing phone OTP and delete it to avoid duplicates
    BuyerOTP.objects.filter(
        phone_number=phone_number,
        purpose='verify_phone',
    ).delete()

    # Create new OTP record in database
    otp_record = BuyerOTP.objects.create(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='verify_phone',
        expires_at=expires_at,
        buyer_id=None  # No buyer profile yet during signup
    )

    # Send OTP via SMS
    TwilioService.send_otp_sms(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='phone_verification'
    )

    response = {
        'success': True,
        'message': 'OTP sent to your phone',
        'phone': phone_number,
        'expires_in_minutes': otp_expiry_minutes
    }

    return Response(response, status=status.HTTP_200_OK)


@api_view(['POST']) 
@permission_classes([AllowAny])
def request_email_otp(request):
    """
    Request OTP for email verification during signup
    
    Requires: email
    Returns: Message confirming OTP sent to email
    """
    email = _normalize_email(request.data.get('email'))

    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if email already registered
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Email already registered'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Generate OTP
    otp_code = _generate_otp()
    otp_expiry_minutes = 15
    expires_at = timezone.now() + timedelta(minutes=otp_expiry_minutes)

    # Replace old email OTP records to keep only the active signup code.
    BuyerOTP.objects.filter(
        email=email,
        purpose='registration',  # Use registration purpose for email OTP
    ).delete()

    # Create new OTP record in database
    otp_record = BuyerOTP.objects.create(
        email=email,
        otp_code=otp_code,
        purpose='registration',
        expires_at=expires_at,
        buyer_id=None  # No buyer profile yet during signup
    )

    # Send OTP via Email
    try:
        send_buyer_otp_verification_email(
            user_email=email,
            user_name='New User',
            otp=otp_code
        )
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        otp_record.delete()
        return Response({
            'error': 'Failed to send email. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response = {
        'success': True,
        'message': 'OTP sent to your email',
        'email': email,
        'expires_in_minutes': otp_expiry_minutes
    }

    return Response(response, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    """
    Verify phone OTP code during signup
    
    Requires: phone_number, otp_code
    Returns: Verification confirmation
    """
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('otp_code') or request.data.get('code')

    if not phone_number or not otp_code:
        return Response({
            'error': 'Phone number and OTP code are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    phone_number = _normalize_phone(phone_number)
    otp_code = str(otp_code).strip()

    # Find the OTP record in database
    try:
        otp_record = BuyerOTP.objects.get(
            phone_number=phone_number,
            purpose='verify_phone',
            is_verified=False
        )
    except BuyerOTP.DoesNotExist:
        return Response({
            'error': 'Please request an OTP code first'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if expired
    if otp_record.expires_at < timezone.now():
        otp_record.delete()
        return Response({
            'error': 'OTP code has expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check attempts
    max_attempts = 3
    if otp_record.attempts >= max_attempts:
        otp_record.delete()
        return Response({
            'error': 'Too many failed attempts. Please request a new code.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify code
    if otp_record.otp_code != otp_code:
        otp_record.attempts += 1
        otp_record.save()
        remaining = max_attempts - otp_record.attempts
        return Response({
            'error': f'Invalid code. {remaining} attempts remaining.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Mark as verified in database
    otp_record.is_verified = True
    otp_record.save()

    request.session[f'phone_otp_{phone_number}'] = {
        'verified': True,
        'phone': phone_number,
        'verified_at': timezone.now().isoformat(),
    }

    return Response({
        'success': True,
        'message': 'Phone number verified successfully',
        'verified': True,
        'phone': phone_number
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_otp(request):
    """
    Verify email OTP code during signup
    
    Requires: email, otp_code
    Returns: Verification confirmation
    """
    email = _normalize_email(request.data.get('email'))
    otp_code = request.data.get('otp_code') or request.data.get('code')

    if not email or not otp_code:
        return Response({
            'error': 'Email and OTP code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    otp_code = str(otp_code).strip()

    # Find the OTP record in database
    try:
        otp_record = BuyerOTP.objects.get(
            email=email,
            purpose='registration',
            is_verified=False
        )
    except BuyerOTP.DoesNotExist:
        return Response({
            'error': 'Please request an OTP code first'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if expired
    if otp_record.expires_at < timezone.now():
        otp_record.delete()
        return Response({
            'error': 'OTP code has expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check attempts
    max_attempts = 3
    if otp_record.attempts >= max_attempts:
        otp_record.delete()
        return Response({
            'error': 'Too many failed attempts. Please request a new code.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify code
    if otp_record.otp_code != otp_code:
        otp_record.attempts += 1
        otp_record.save()
        remaining = max_attempts - otp_record.attempts
        return Response({
            'error': f'Invalid code. {remaining} attempts remaining.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Mark as verified in database
    otp_record.is_verified = True
    otp_record.save()

    request.session[f'email_otp_{email}'] = {
        'verified': True,
        'email': email,
        'verified_at': timezone.now().isoformat(),
    }

    return Response({
        'success': True,
        'message': 'Email verified successfully',
        'verified': True,
        'email': email
    }, status=status.HTTP_200_OK)


@api_view(['POST']) 
@permission_classes([AllowAny])
def register_buyer(request):
    """
    Register buyer after both email and phone are verified
    
    Requires: username, email, password, name, phone_number
    (email and phone_number must be verified first via verify_phone_otp and verify_email_otp)
    Returns: User info and tokens
    """
    username = str(request.data.get('username') or '').strip()
    email = _normalize_email(request.data.get('email'))
    password = request.data.get('password')
    name = request.data.get('name')
    phone_number = request.data.get('phone_number')

    if not username or not email or not password or not name or not phone_number:
        return Response({
            'error': 'All fields are required (username, email, password, name, phone_number)'
        }, status=status.HTTP_400_BAD_REQUEST)

    phone_number = _normalize_phone(phone_number)

    # Check that phone was verified
    phone_session_key = f'phone_otp_{phone_number}'
    phone_verified = request.session.get(phone_session_key, {}).get('verified') or BuyerOTP.objects.filter(
        phone_number=phone_number,
        purpose='verify_phone',
        is_verified=True,
    ).exists()
    if not phone_verified:
        return Response({
            'error': 'Phone number must be verified first'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check that email was verified
    email_session_key = f'email_otp_{email}'
    email_verified = request.session.get(email_session_key, {}).get('verified') or BuyerOTP.objects.filter(
        email=email,
        purpose='registration',
        is_verified=True,
    ).exists()
    if not email_verified:
        return Response({
            'error': 'Email must be verified first'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing username
    if User.objects.filter(username=username).exists():
        return Response({
            'error': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing email
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # All verification complete - create the actual user account
    try:
        user = User.objects.create_user(
            username=username, 
            email=email, 
            password=password,
            first_name=name.split()[0],
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
        )

        # Create buyer profile with email and phone number
        buyer_profile = BuyerProfile.objects.create(
            user=user,
            email=email,
            phone=phone_number
        )

        # Clean up session data
        if phone_session_key in request.session:
            del request.session[phone_session_key]
        if email_session_key in request.session:
            del request.session[email_session_key]
        BuyerOTP.objects.filter(
            phone_number=phone_number,
            purpose='verify_phone',
            is_verified=True,
        ).delete()
        BuyerOTP.objects.filter(
            email=email,
            purpose='registration',
            is_verified=True,
        ).delete()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': email,
                'phone': phone_number,
                'name': name
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error during buyer registration: {str(e)}")
        return Response({
            'error': f'Registration failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    
    # Send password reset OTP email if phone lookup was successful
    try:
        buyer = BuyerProfile.objects.get(phone=phone_number)
        send_buyer_password_reset_otp_email(
            email=buyer.user.email,
            name=buyer.user.first_name or buyer.user.username,
            otp=result.get('debug_otp') if settings.DEBUG else 'Check your email'
        )
    except BuyerProfile.DoesNotExist:
        # Silently continue - phone might not be registered
        pass
    except Exception as e:
        # Log but don't fail the response - SMS was already sent
        logger.error(f"Failed to send password reset email: {str(e)}")
    
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

def _normalize_email(email):
    """Normalize email for OTP lookup and account creation."""
    if not email:
        return None
    return str(email).strip().lower()

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
