from django.contrib import admin
from .models import BuyerProfile, Cart, CartItem, Order, OrderItem, Payment, Rating, LocationHistory, AddressCache, WaitlistEntry

@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'address', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User Info', {
            'fields': ('user',)
        }),
        ('Contact', {
            'fields': ('phone', 'address')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
        ('Profile Image', {
            'fields': ('image',)
        }),
        ('Preferences', {
            'fields': ('preferences',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['buyer', 'restaurant', 'created_at', 'get_items_count', 'get_total_price']
    list_filter = ['restaurant', 'created_at']
    search_fields = ['buyer__user__username', 'restaurant__name']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_items_count(self, obj):
        return obj.items.count()
    get_items_count.short_description = 'Items'
    
    def get_total_price(self, obj):
        return f"₦{obj.total_price():,.2f}"
    get_total_price.short_description = 'Total Price'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart', 'menu_item', 'quantity']
    readonly_fields = ['cart', 'menu_item', 'quantity']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'restaurant', 'total_price', 'status', 'created_at']
    readonly_fields = ['buyer', 'restaurant', 'total_price', 'delivery_fee', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['buyer__user__username', 'restaurant__name']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'menu_item', 'quantity', 'price', 'get_subtotal']
    readonly_fields = ['order', 'menu_item', 'quantity', 'price', 'get_subtotal']

    def get_subtotal(self, obj):
        """✅ FIXED: Calculate subtotal from price * quantity"""
        subtotal = obj.price * obj.quantity
        return f"₦{subtotal:,.2f}"
    
    get_subtotal.short_description = 'Subtotal'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'amount', 'status', 'created_at']
    readonly_fields = ['order', 'amount', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'rating', 'created_at']
    readonly_fields = ['order', 'rating', 'comment', 'created_at']


@admin.register(LocationHistory)
class LocationHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'order', 'get_coordinates', 'accuracy', 'is_live_tracking', 'recorded_at']
    list_filter = ['is_live_tracking', 'recorded_at', 'buyer']
    search_fields = ['buyer__user__username', 'order__id']
    readonly_fields = ['buyer', 'order', 'latitude', 'longitude', 'accuracy', 'recorded_at']
    date_hierarchy = 'recorded_at'

    def get_coordinates(self, obj):
        return f"({obj.latitude:.6f}, {obj.longitude:.6f})"
    get_coordinates.short_description = 'GPS Coordinates'

    fieldsets = (
        ('Order & Buyer', {
            'fields': ('buyer', 'order')
        }),
        ('Location Data', {
            'fields': ('latitude', 'longitude', 'accuracy')
        }),
        ('Tracking Status', {
            'fields': ('is_live_tracking',)
        }),
        ('Timestamp', {
            'fields': ('recorded_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(AddressCache)
class AddressCacheAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'cache_type', 'get_coordinates', 'access_count', 'created_at']
    list_filter = ['cache_type', 'created_at', 'importance']
    search_fields = ['query_text', 'display_name', 'query_hash']
    readonly_fields = ['query_hash', 'created_at', 'last_accessed', 'raw_data']
    date_hierarchy = 'created_at'

    def get_coordinates(self, obj):
        return f"({obj.latitude:.4f}, {obj.longitude:.4f})"
    get_coordinates.short_description = 'Coordinates'

    fieldsets = (
        ('Query Info', {
            'fields': ('query_text', 'query_hash', 'cache_type')
        }),
        ('Location Data', {
            'fields': ('display_name', 'latitude', 'longitude', 'address_type', 'importance')
        }),
        ('Cache Stats', {
            'fields': ('access_count', 'created_at', 'last_accessed'),
            'classes': ('collapse',)
        }),
        ('Raw Data', {
            'fields': ('raw_data',),
            'classes': ('collapse',)
        }),
    )


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'restaurant', 'position', 'group_size', 'status', 'estimated_wait_time', 'created_at']
    list_filter = ['restaurant', 'status', 'created_at']
    search_fields = ['buyer__user__username', 'restaurant__name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['restaurant', 'position']