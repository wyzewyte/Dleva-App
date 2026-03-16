from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    BuyerProfile, Cart, CartItem, 
    Order, OrderItem, Payment, Rating
)
from seller.models import Restaurant, MenuItem


class BuyerProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = BuyerProfile
        fields = ['id', 'name', 'email', 'phone', 'address', 'latitude', 'longitude', 'image']
    
    def get_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name.strip() else obj.user.username
    
    def get_email(self, obj):
        return obj.user.email

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class RestaurantSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'description', 'address', 'category', 'image', 'delivery_fee', 'delivery_time', 'latitude', 'longitude', 'rating', 'is_active']

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

    class Meta:
        model = MenuItem
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'available', 'image']

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
    buyer_name = serializers.CharField(source='buyer.user.get_full_name', read_only=True)
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'restaurant', 'restaurant_name', 'buyer_name', 
            'total_price', 'delivery_fee', 'delivery_address', 
            'delivery_latitude', 'delivery_longitude',
            'status', 'payment_method', 'is_rated', 'items', 
            'subtotal', 'confirmation_code', 'created_at', 'updated_at'
        ]
    
    def get_subtotal(self, obj):
        """Calculate subtotal from order items"""
        subtotal = sum(
            float(item.price * item.quantity) 
            for item in obj.items.all()
        )
        return subtotal


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
