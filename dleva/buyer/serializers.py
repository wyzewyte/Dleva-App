from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    BuyerProfile, Cart, CartItem, 
    Order, OrderItem, Payment, Rating, Waitlist
)
from seller.models import Restaurant, MenuItem


class BuyerProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    
    class Meta:
        model = BuyerProfile
        fields = ['id', 'name', 'email', 'phone', 'address', 'latitude', 'longitude', 'image', 'initials']
    
    def get_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name.strip() else obj.user.username

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def get_initials(self, obj):
        return obj.get_initials()


class RestaurantSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    is_open = serializers.BooleanField(source='is_active', read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id',
            'name',
            'description',
            'address',
            'image',
            'delivery_fee',
            'delivery_time',
            'latitude',
            'longitude',
            'rating',
            'is_active',
            'is_open',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        try:
            url = obj.image.url
        except Exception:
            url = str(obj.image)
        if request:
            return request.build_absolute_uri(url)
        return url
    
    def get_rating(self, obj):
        ratings = obj.ratings.all()
        if ratings.exists():
            avg_rating = sum(r.rating for r in ratings) / len(ratings)
            return round(avg_rating, 1)
        return 0


class MenuItemSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'available', 'category', 'category_name', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        try:
            url = obj.image.url
        except Exception:
            url = str(obj.image)
        if request:
            return request.build_absolute_uri(url)
        return url


class CartItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'menu_item', 'quantity', 'subtotal']

    def get_subtotal(self, obj):
        return obj.menu_item.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'restaurant', 'restaurant_name', 'items', 'total', 'created_at']

    def get_total(self, obj):
        return obj.total_price()


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()
    
    class Meta: 
        model = OrderItem
        fields = ['id', 'menu_item', 'quantity', 'price', 'subtotal']  # ✅ quantity IS here

    def get_subtotal(self, obj):
        return float(obj.price * obj.quantity)  # ✅ Uses quantity correctly


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_obj = RestaurantSerializer(source='restaurant', read_only=True)
    buyer_name = serializers.CharField(source='buyer.user.get_full_name', read_only=True)
    rider_id = serializers.IntegerField(source='rider.id', read_only=True)
    rider_name = serializers.CharField(source='rider.user.get_full_name', read_only=True)
    restaurant_phone = serializers.CharField(source='restaurant.seller.phone', read_only=True)
    rider_phone = serializers.CharField(source='rider.phone_number', read_only=True)
    subtotal = serializers.SerializerMethodField()
    food_subtotal = serializers.SerializerMethodField()
    restaurant_commission_amount = serializers.SerializerMethodField()
    restaurant_earnings = serializers.SerializerMethodField()
    has_restaurant_rating = serializers.SerializerMethodField()
    has_rider_rating = serializers.SerializerMethodField()
    
    
    class Meta:
        model = Order
        fields = [
            'id', 'restaurant', 'restaurant_obj', 'restaurant_name', 'buyer_name', 
            'total_price', 'delivery_fee', 'delivery_address', 
            'delivery_latitude', 'delivery_longitude',
            'status', 'payment_method', 'is_rated', 'items',
            'rider_id', 'rider_name', 'restaurant_phone', 'rider_phone',
            'subtotal', 'food_subtotal', 'restaurant_commission_amount', 'restaurant_earnings',
            'has_restaurant_rating', 'has_rider_rating',
            'confirmation_code', 'created_at', 'updated_at'
        ]
    
    def get_subtotal(self, obj):
        """Calculate subtotal from order items"""
        subtotal = sum(
            float(item.price * item.quantity) 
            for item in obj.items.all()
        )
        return subtotal
    
    def get_food_subtotal(self, obj):
        """Food subtotal (excluding delivery fee)"""
        return float(obj.total_price - obj.delivery_fee)
    
    def get_restaurant_commission_amount(self, obj):
        """Commission amount deducted from food subtotal"""
        from seller.models import RestaurantCommissionConfig
        from decimal import Decimal
        
        config = RestaurantCommissionConfig.get_active_config()
        food_subtotal = Decimal(str(obj.total_price - obj.delivery_fee))
        commission = config.calculate_commission_amount(food_subtotal)
        return float(commission)

    def get_has_restaurant_rating(self, obj):
        return obj.has_restaurant_rating()

    def get_has_rider_rating(self, obj):
        return obj.has_rider_rating()
    
    def get_restaurant_earnings(self, obj):
        """Amount restaurant earns after commission deduction"""
        from seller.models import RestaurantCommissionConfig
        from decimal import Decimal
        
        config = RestaurantCommissionConfig.get_active_config()
        food_subtotal = Decimal(str(obj.total_price - obj.delivery_fee))
        earnings = config.calculate_restaurant_earnings(food_subtotal)
        return float(earnings)


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'order_id', 'reference', 'amount', 'status', 'provider', 'created_at']


class RatingSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    buyer_name = serializers.CharField(source='buyer.user.get_full_name', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'order', 'buyer_name', 'restaurant_name', 'rating', 'comment', 'created_at']


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = ['id', 'latitude', 'longitude', 'address', 'email', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at']
