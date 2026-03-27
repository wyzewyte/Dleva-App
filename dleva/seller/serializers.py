from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SellerProfile, MenuItem, Restaurant, Payout, PayoutDetails, MenuItemCategory

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ['id', 'username', 'email']


class MenuItemCategorySerializer(serializers.ModelSerializer):
    """Serializer for menu item categories"""
    class Meta:
        model = MenuItemCategory
        fields = ['id', 'name', 'description', 'order', 'icon', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SellerRegistrationSerializer(serializers.Serializer):
    """Serializer for seller registration with username, first_name, last_name, and restaurant details"""
    username = serializers.CharField(max_length=150, required=True)
    first_name = serializers.CharField(max_length=30, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=8, required=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    restaurant_name = serializers.CharField(max_length=100, required=True)
    business_type = serializers.ChoiceField(choices=['restaurant', 'student_vendor'], required=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def create(self, validated_data):
        # Extract user data
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        # Extract restaurant data
        restaurant_name = validated_data.pop('restaurant_name')
        business_type = validated_data.pop('business_type')
        
        # Extract profile data
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create SellerProfile
        seller_profile = SellerProfile.objects.create(
            user=user,
            phone=phone,
            address=address,
            business_type=business_type,
            restaurant_name=restaurant_name
        )
        
        # Auto-create Restaurant
        restaurant = Restaurant.objects.create(
            seller=seller_profile,
            name=restaurant_name,
            description='',
            is_active=True,
            address=address
        )
        
        return seller_profile
    

class SellerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    image = serializers.ImageField(required=False)

    class Meta:
        model = SellerProfile
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'business_type', 'restaurant_name', 'address', 'phone', 'latitude', 'longitude',
                  'image', 'created_at']
        
class SellerMenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image = serializers.ImageField(required=False)

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'available', 'category', 'category_name', 'image', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class RestaurantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ['name', 'description', 'is_active', 'image', 'address', 'latitude', 'longitude']
        
    def update(self, instance, validated_data):
        # ✅ Ensure is_active is handled properly
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.is_active = validated_data.get('is_active', instance.is_active)  # ✅ Important
        instance.address = validated_data.get('address', instance.address)
        instance.latitude = validated_data.get('latitude', instance.latitude)
        instance.longitude = validated_data.get('longitude', instance.longitude)
        
        if 'image' in self.initial_data and self.initial_data['image']:
            instance.image = validated_data.get('image', instance.image)
        
        instance.save()
        return instance

class PayoutSerializer(serializers.ModelSerializer):
    bank = serializers.CharField(source='bank_name', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Payout
        fields = ['id', 'date', 'bank', 'amount', 'status']
        read_only_fields = ['id', 'date']

class SellerProfileSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['phone', 'address', 'latitude', 'longitude', 'image', 'business_type']

class PayoutDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutDetails
        fields = ['bank_name', 'account_number', 'account_name', 'verified']
        read_only_fields = ['verified']