from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
import random
import string
import logging

from .models import RiderProfile, RiderOTP
from .serializers import (
    RiderRegistrationSerializer, RiderLoginSerializer,
    RiderOTPVerificationSerializer
)
from utils.twilio_service import TwilioService
from utils.password_reset_service import create_password_reset_service
from emails.notifications import send_rider_otp_verification_email, send_rider_password_reset_otp_email

logger = logging.getLogger(__name__)

# Initialize password reset service for riders
# RiderOTP uses 'rider' field (not 'profile')
rider_password_reset_service = create_password_reset_service(
    RiderProfile, 
    RiderOTP, 
    profile_field_name='rider'
)

def normalize_phone_number(value):
    if value is None:
        return None
    return str(value).strip().replace(' ', '')


def normalize_email(value):
    if not value:
        return None
    return str(value).strip().lower()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_rider(request):
    """Register a new rider"""
    data = request.data.copy()
    data['phone_number'] = normalize_phone_number(data.get('phone_number'))
    data['email'] = normalize_email(data.get('email'))
    serializer = RiderRegistrationSerializer(data=data)
    if serializer.is_valid():
        phone_number = data.get('phone_number')
        email = data.get('email')

        phone_session_key = f'rider_phone_otp_{phone_number}'
        phone_verified = request.session.get(phone_session_key, {}).get('verified') or RiderOTP.objects.filter(
            phone_number=phone_number,
            purpose='verify_phone',
            is_verified=True,
        ).exists()
        if not phone_verified:
            return Response({'error': 'Phone number must be verified first'}, status=status.HTTP_400_BAD_REQUEST)

        email_session_key = f'rider_email_otp_{email}'
        email_verified = request.session.get(email_session_key, {}).get('verified') or RiderOTP.objects.filter(
            email=email,
            purpose='registration',
            is_verified=True,
        ).exists()
        if not email_verified:
            return Response({'error': 'Email must be verified first'}, status=status.HTTP_400_BAD_REQUEST)

        result = serializer.save()
        user = result['user']
        rider_profile = result['rider_profile']

        rider_profile.phone_verified = True
        rider_profile.email_verified = True
        rider_profile.calculate_profile_completion()
        rider_profile.save(update_fields=['phone_verified', 'email_verified', 'profile_completion_percent'])

        RiderOTP.objects.filter(phone_number=phone_number, purpose='verify_phone', is_verified=True).delete()
        RiderOTP.objects.filter(email=email, purpose='registration', is_verified=True).delete()
        request.session.pop(phone_session_key, None)
        request.session.pop(email_session_key, None)

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Registration successful. Continue rider verification.',
            'user_id': user.id,
            'rider_id': rider_profile.id,
            'next_step': 'verification_setup',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'rider': {
                'id': rider_profile.id,
                'full_name': rider_profile.full_name,
                'phone_number': rider_profile.phone_number,
                'email': rider_profile.email,
                'account_status': rider_profile.account_status,
                'verification_status': rider_profile.verification_status,
                'phone_verified': rider_profile.phone_verified,
                'email_verified': rider_profile.email_verified,
                'profile_completion_percent': rider_profile.profile_completion_percent,
                'is_online': rider_profile.is_online,
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_rider(request):
    """Login rider and return JWT tokens"""
    serializer = RiderLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        try:
            rider_profile = RiderProfile.objects.get(user=user)
        except RiderProfile.DoesNotExist:
            return Response(
                {'message': 'Rider profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'rider': {
                'id': rider_profile.id,
                'full_name': rider_profile.full_name,
                'phone_number': rider_profile.phone_number,
                'account_status': rider_profile.account_status,
                'verification_status': rider_profile.verification_status,
                'phone_verified': rider_profile.phone_verified,
                'email_verified': rider_profile.email_verified,
                'profile_completion_percent': rider_profile.profile_completion_percent,
                'is_online': rider_profile.is_online
            },
            'account_status': rider_profile.account_status,
            'verification_status': rider_profile.verification_status,
            'document_status': get_document_status(rider_profile),
            'profile_completion_percent': rider_profile.profile_completion_percent,
            'is_online': rider_profile.is_online
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_phone_otp(request):
    """Request OTP for rider phone verification."""
    phone_number = normalize_phone_number(request.data.get('phone_number'))
    
    if not phone_number:
        return Response(
            {'message': 'Phone number is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    existing_rider = RiderProfile.objects.filter(phone_number=phone_number).first()
    if existing_rider and (
        not request.user.is_authenticated or existing_rider.user_id != request.user.id
    ):
        return Response(
            {'message': 'Phone number already registered.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    rider = existing_rider if existing_rider and existing_rider.user_id == request.user.id else None
    
    # Generate new OTP
    otp_code = generate_otp()
    RiderOTP.objects.filter(phone_number=phone_number, purpose='verify_phone').delete()
    RiderOTP.objects.create(
        rider=rider,
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='verify_phone',
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    
    # Send OTP via SMS
    sms_result = TwilioService.send_otp_sms(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='phone_verification'
    )
    
    response_data = {
        'message': 'OTP sent successfully.',
        'otp_sent_to': phone_number,
        'expires_in_minutes': 10,
        'sms_delivery': 'success' if sms_result.get('success') else 'pending'
    }
    if settings.DEBUG:
        response_data['debug_otp'] = otp_code
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_email_otp(request):
    """Request OTP for rider email verification during signup."""
    email = normalize_email(request.data.get('email'))
    rider_name = str(request.data.get('rider_name') or 'Rider').strip() or 'Rider'

    if not email:
        return Response(
            {'message': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists() or RiderProfile.objects.filter(email=email).exists():
        return Response(
            {'message': 'Email already registered.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp_code = generate_otp()
    RiderOTP.objects.filter(email=email, purpose='registration').delete()
    otp = RiderOTP.objects.create(
        email=email,
        otp_code=otp_code,
        purpose='registration',
        expires_at=timezone.now() + timedelta(minutes=10)
    )

    try:
        email_sent = send_rider_otp_verification_email(
            user_email=email,
            rider_name=rider_name,
            otp=otp_code
        )
    except Exception as e:
        logger.error(f"Failed to send rider OTP email to {email}: {str(e)}")
        otp.delete()
        return Response(
            {'message': 'Failed to send email. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    if not email_sent:
        logger.error(f"Rider OTP email service returned failure for {email}")
        otp.delete()
        return Response(
            {'message': 'Failed to send email. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    response_data = {
        'message': 'OTP sent successfully.',
        'otp_sent_to': email,
        'expires_in_minutes': 10,
    }
    if settings.DEBUG:
        response_data['debug_otp'] = otp_code
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    """Verify phone number with OTP"""
    phone_number = normalize_phone_number(request.data.get('phone_number'))
    otp_code = str(request.data.get('otp_code', '')).strip()
    
    if not phone_number or not otp_code:
        return Response(
            {'message': 'Phone number and OTP code are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get the OTP record
    try:
        otp = RiderOTP.objects.filter(
            phone_number=phone_number,
            purpose='verify_phone',
            otp_code=otp_code,
            is_verified=False
        ).latest('created_at')
    except RiderOTP.DoesNotExist:
        # OTP doesn't exist, might be wrong code or expired
        try:
            latest_otp = RiderOTP.objects.filter(
                phone_number=phone_number,
                purpose='verify_phone',
                is_verified=False
            ).latest('created_at')
            latest_otp.attempts += 1
            latest_otp.save()
        except RiderOTP.DoesNotExist:
            pass
        
        return Response(
            {'message': 'Invalid OTP.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if OTP is expired
    if otp.expires_at < timezone.now():
        return Response(
            {'message': 'OTP has expired.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check attempts
    if otp.attempts >= 3:
        return Response(
            {'message': 'Maximum OTP attempts exceeded. Please request a new OTP.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark OTP as verified
    otp.is_verified = True
    otp.save(update_fields=['is_verified'])
    
    # Update rider profile with new phone number
    rider = otp.rider
    if rider:
        rider.phone_number = phone_number
        rider.phone_verified = True
        rider.calculate_profile_completion()
        rider.save()

    request.session[f'rider_phone_otp_{phone_number}'] = {
        'verified': True,
        'phone': phone_number,
        'verified_at': timezone.now().isoformat(),
    }
    
    return Response({
        'message': 'Phone number verified successfully.',
        'next_step': 'upload_documents',
        'profile_completion_percent': rider.profile_completion_percent if rider else None
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_otp(request):
    """Verify rider email OTP during signup."""
    email = normalize_email(request.data.get('email'))
    otp_code = str(request.data.get('otp_code') or request.data.get('code') or '').strip()

    if not email or not otp_code:
        return Response(
            {'message': 'Email and OTP code are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        otp = RiderOTP.objects.filter(
            email=email,
            purpose='registration',
            otp_code=otp_code,
            is_verified=False
        ).latest('created_at')
    except RiderOTP.DoesNotExist:
        try:
            latest_otp = RiderOTP.objects.filter(
                email=email,
                purpose='registration',
                is_verified=False
            ).latest('created_at')
            latest_otp.attempts += 1
            latest_otp.save(update_fields=['attempts'])
        except RiderOTP.DoesNotExist:
            pass

        return Response(
            {'message': 'Invalid OTP.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if otp.expires_at < timezone.now():
        otp.delete()
        return Response(
            {'message': 'OTP has expired.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if otp.attempts >= 3:
        otp.delete()
        return Response(
            {'message': 'Maximum OTP attempts exceeded. Please request a new OTP.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp.is_verified = True
    otp.save(update_fields=['is_verified'])
    request.session[f'rider_email_otp_{email}'] = {
        'verified': True,
        'email': email,
        'verified_at': timezone.now().isoformat(),
    }

    return Response({
        'message': 'Email verified successfully.',
        'verified': True,
        'email': email,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_phone_otp(request):
    """Resend OTP for phone verification"""
    phone_number = normalize_phone_number(request.data.get('phone_number'))
    
    if not phone_number:
        return Response(
            {'message': 'Phone number is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        rider = RiderProfile.objects.get(user=request.user)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Delete previous OTP for this phone number
    RiderOTP.objects.filter(
        rider=rider,
        phone_number=phone_number,
        is_verified=False
    ).delete()
    
    # Generate new OTP
    otp_code = generate_otp()
    RiderOTP.objects.create(
        rider=rider,
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    
    # Send OTP via SMS
    sms_result = TwilioService.send_otp_sms(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='phone_verification'
    )
    
    response_data = {
        'message': 'OTP resent successfully.',
        'otp_sent_to': phone_number,
        'expires_in_minutes': 10,
        'sms_delivery': 'success' if sms_result.get('success') else 'pending'
    }
    if settings.DEBUG:
        response_data['debug_otp'] = otp_code
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_registration_otp(request):
    """Resend OTP during registration"""
    phone_number = normalize_phone_number(request.data.get('phone_number'))
    rider_id = request.data.get('rider_id')
    
    if not phone_number or not rider_id:
        return Response(
            {'message': 'Phone number and rider ID are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        rider = RiderProfile.objects.get(id=rider_id, phone_number=phone_number)
    except RiderProfile.DoesNotExist:
        return Response(
            {'message': 'Rider not found with the provided details.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Delete previous OTP for this registration
    RiderOTP.objects.filter(
        rider=rider,
        phone_number=phone_number,
        is_verified=False
    ).delete()
    
    # Generate new OTP
    otp_code = generate_otp()
    RiderOTP.objects.create(
        rider=rider,
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    
    # Send OTP via SMS
    sms_result = TwilioService.send_otp_sms(
        phone_number=phone_number,
        otp_code=otp_code,
        purpose='registration'
    )
    
    response_data = {
        'message': 'OTP resent successfully.',
        'otp_sent_to': phone_number,
        'expires_in_minutes': 10,
        'sms_delivery': 'success' if sms_result.get('success') else 'pending'
    }
    if settings.DEBUG:
        response_data['debug_otp'] = otp_code
    return Response(response_data, status=status.HTTP_200_OK)


def generate_otp():
    """Generate random 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def get_document_status(rider):
    """Get document approval status"""
    documents = rider.documents.all()
    if not documents.exists():
        return 'not_uploaded'
    
    approved = documents.filter(status='approved').exists()
    pending = documents.filter(status='pending').exists()
    rejected = documents.filter(status='rejected').exists()
    
    if rejected:
        return 'rejected'
    elif pending:
        return 'pending'
    elif approved:
        return 'approved'
    
    return 'not_uploaded'


# ============================================================================
# PASSWORD RESET ENDPOINTS (Phone OTP based) - Reusable for Buyers/Sellers
# ============================================================================
# Using PasswordResetOTPService for clean, reusable password reset flows

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_rider(request):
    """
    Request password reset OTP for a rider
    
    Requires: phone_number (rider's phone)
    Returns: OTP sent to phone (in DEBUG mode)
    """
    phone_number = request.data.get('phone_number')
    result = rider_password_reset_service.request_password_reset(phone_number)
    
    # Check if successful
    if not result.get('success', False):
        return Response({'error': result.get('error', 'Failed to send code')}, status=result.get('code', status.HTTP_400_BAD_REQUEST))
    
    # Send password reset OTP email if phone lookup was successful
    try:
        rider = RiderProfile.objects.get(phone_number=phone_number)
        send_rider_password_reset_otp_email(
            email=rider.user.email,
            name=rider.user.first_name or rider.user.username,
            otp=result.get('debug_otp') if settings.DEBUG else 'Check your email'
        )
    except RiderProfile.DoesNotExist:
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
def verify_reset_code_rider(request):
    """
    Verify OTP code for password reset
    
    Requires: phone_number, code (OTP)
    Returns: Reset token for next step
    """
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('code') or request.data.get('otp_code')
    
    result = rider_password_reset_service.verify_reset_code(phone_number, otp_code)
    
    if not result['success']:
        return Response({'error': result['error']}, status=result['code'])
    
    return Response({
        'message': result['message'],
        'phone': phone_number,
        'verified': result['verified']
    }, status=result['code'])


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_rider(request):
    """
    Reset rider password after OTP verification
    
    Requires: phone_number, code (OTP), password (new password)
    Returns: Success message
    """
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('code') or request.data.get('otp_code')
    new_password = request.data.get('password')
    
    result = rider_password_reset_service.reset_password(phone_number, otp_code, new_password)
    
    if not result['success']:
        return Response({'error': result['error']}, status=result['code'])
    
    return Response({
        'message': result['message'],
        'success': result['success']
    }, status=result['code'])
