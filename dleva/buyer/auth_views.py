from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import BuyerProfile
from .serializers import BuyerProfileSerializer

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
