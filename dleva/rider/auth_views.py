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

from .models import RiderProfile, RiderOTP
from .serializers import (
    RiderRegistrationSerializer, RiderLoginSerializer,
    RiderOTPVerificationSerializer
)
from utils.twilio_service import TwilioService

def normalize_phone_number(value):
    if value is None:
        return None
    return str(value).strip().replace(' ', '')


@api_view(['POST'])
@permission_classes([AllowAny])
def register_rider(request):
    """Register a new rider"""
    serializer = RiderRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        result = serializer.save()
        user = result['user']
        rider_profile = result['rider_profile']
        
        # Generate and send OTP
        otp_code = generate_otp()
        RiderOTP.objects.create(
            rider=rider_profile,
            phone_number=rider_profile.phone_number,
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Send OTP via SMS
        sms_result = TwilioService.send_otp_sms(
            phone_number=rider_profile.phone_number,
            otp_code=otp_code,
            purpose='registration'
        )
        
        # Log SMS result for debugging
        if sms_result.get('success'):
            sms_status = 'sent via SMS'
        else:
            sms_status = 'failed (check console output)'
        
        response_data = {
            'message': 'Registration successful. Please verify your phone number.',
            'user_id': user.id,
            'rider_id': rider_profile.id,
            'next_step': 'verify_phone',
            'otp_sent_to': rider_profile.phone_number
        }
        if settings.DEBUG:
            response_data['debug_otp'] = otp_code
        return Response(response_data, status=status.HTTP_201_CREATED)
    
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
@permission_classes([IsAuthenticated])
def request_phone_otp(request):
    """Request OTP for phone verification"""
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
            otp_code=otp_code,
            is_verified=False
        ).latest('created_at')
    except RiderOTP.DoesNotExist:
        # OTP doesn't exist, might be wrong code or expired
        try:
            latest_otp = RiderOTP.objects.filter(
                phone_number=phone_number,
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
    otp.save()
    
    # Update rider profile with new phone number
    rider = otp.rider
    rider.phone_number = phone_number  # ✅ Update to new phone number
    rider.phone_verified = True
    rider.calculate_profile_completion()
    rider.save()
    
    return Response({
        'message': 'Phone number verified successfully.',
        'next_step': 'upload_documents',
        'profile_completion_percent': rider.profile_completion_percent
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
