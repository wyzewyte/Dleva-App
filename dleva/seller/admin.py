from django.contrib import admin
from django import forms
from .models import SellerProfile, Restaurant, MenuItem, MenuItemCategory, RestaurantCommissionConfig
from django.utils.html import format_html

class RestaurantAdminForm(forms.ModelForm):
    class Meta:
        model = Restaurant
        fields = ['seller', 'name', 'description', 'address', 'latitude', 'longitude', 'image', 'delivery_fee', 'delivery_time', 'is_active']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # If seller is selected, auto-fill address/lat/lng from SellerProfile
        if self.instance.pk:
            # Editing existing restaurant
            seller = self.instance.seller
            if seller:
                self.fields['address'].initial = seller.address
                self.fields['latitude'].initial = seller.latitude
                self.fields['longitude'].initial = seller.longitude
                self.fields['delivery_fee'].initial = 500  # or from settings
                self.fields['delivery_time'].initial = '30-45 mins'
        else:
            # New restaurant form - watch for seller change
            seller_field = self.fields['seller']
            
            # Add a custom widget or JS to handle dynamic updates
            # For now, just set defaults
            self.fields['delivery_fee'].initial = 500
            self.fields['delivery_time'].initial = '30-45 mins'

    def clean(self):
        cleaned_data = super().clean()
        seller = cleaned_data.get('seller')
        
        # Auto-fill from seller if not already filled
        if seller:
            if not cleaned_data.get('address'):
                cleaned_data['address'] = seller.address or ''
            if not cleaned_data.get('latitude'):
                cleaned_data['latitude'] = seller.latitude or 0
            if not cleaned_data.get('longitude'):
                cleaned_data['longitude'] = seller.longitude or 0
        
        return cleaned_data

@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ('restaurant_name', 'user', 'business_type', 'phone', 'image_preview')
    search_fields = ('restaurant_name', 'user__username')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        """Display image preview in admin"""
        if obj.image:
            return format_html(
                '<img src="{}" width="150" height="150" style="object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return 'No image'
    image_preview.short_description = 'Image Preview'

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    form = RestaurantAdminForm
    list_display = ['name', 'seller', 'delivery_time', 'is_active', 'image_preview']
    fields = ['seller', 'name', 'description', 'address', 'latitude', 'longitude', 'image', 'image_preview', 'delivery_fee', 'delivery_time', 'is_active']
    readonly_fields = ['image_preview']
    search_fields = ['name']
    list_filter = ['is_active']

    class Media:
        js = ('admin/js/restaurant_admin.js',)
    
    def image_preview(self, obj):
        """Display image preview in admin"""
        if obj.image:
            return format_html(
                '<img src="{}" width="150" height="150" style="object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return 'No image'
    image_preview.short_description = 'Image Preview'

    def save_model(self, request, obj, form, change):
        # Ensure seller is set
        if not obj.seller and hasattr(request.user, 'seller_profile'):
            obj.seller = request.user.seller_profile
        super().save_model(request, obj, form, change)

@admin.register(MenuItemCategory)
class MenuItemCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('order', 'name')

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'category', 'price', 'available', 'image_preview')
    list_filter = ('restaurant', 'category', 'available')
    search_fields = ('name', 'restaurant__name')
    readonly_fields = ('created_at', 'updated_at', 'image_preview')
    fields = ('name', 'restaurant', 'category', 'price', 'available', 'description', 'image', 'image_preview', 'created_at', 'updated_at')

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="150" height="150" style="object-fit:cover;border-radius: 8px"/>', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Image'


@admin.register(RestaurantCommissionConfig)
class RestaurantCommissionConfigAdmin(admin.ModelAdmin):
    """Admin interface for restaurant commission configuration"""
    list_display = ('get_status', 'commission_percent', 'get_examples', 'updated_at')
    fields = ('commission_percent', 'is_active', 'get_examples_display', 'created_at', 'updated_at')
    readonly_fields = ('get_examples_display', 'created_at', 'updated_at')

    def get_status(self, obj):
        """Display active/inactive status with visual indicator"""
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✅ Active</span>')
        return format_html('<span style="color: orange; font-weight: bold;">⚠️ Inactive</span>')
    get_status.short_description = 'Status'

    def get_examples(self, obj):
        """Show example calculations in list view"""
        examples = [
            (1000, obj.calculate_restaurant_earnings(1000)),
            (3000, obj.calculate_restaurant_earnings(3000)),
            (5000, obj.calculate_restaurant_earnings(5000)),
            (10000, obj.calculate_restaurant_earnings(10000)),
        ]
        return format_html(
            '<br>'.join([
                f"₦{food} → ₦{earnings}" for food, earnings in examples
            ])
        )
    get_examples.short_description = 'Example Calculations'

    def get_examples_display(self, obj):
        """Show detailed example calculations in detail view"""
        from decimal import Decimal
        examples = [
            (Decimal('1000'), "₦1,000 food"),
            (Decimal('3000'), "₦3,000 food"),
            (Decimal('5000'), "₦5,000 food"),
            (Decimal('10000'), "₦10,000 food"),
        ]
        html_content = '<table style="border-collapse: collapse; width: 100%;">'
        html_content += '<tr style="border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 8px;">Food Subtotal</th>'
        html_content += '<th style="text-align: left; padding: 8px;">Commission (' + str(obj.commission_percent) + '%)</th>'
        html_content += '<th style="text-align: left; padding: 8px;">Restaurant Earns</th></tr>'
        
        for food_subtotal, label in examples:
            commission = obj.calculate_commission_amount(food_subtotal)
            earnings = obj.calculate_restaurant_earnings(food_subtotal)
            html_content += f'<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">{label}</td>'
            html_content += f'<td style="padding: 8px;">₦{commission:,.2f}</td>'
            html_content += f'<td style="padding: 8px; font-weight: bold;">₦{earnings:,.2f}</td></tr>'
        
        html_content += '</table>'
        return format_html(html_content)
    get_examples_display.short_description = 'Commission Examples'

    def has_add_permission(self, request):
        """Prevent adding new config if one already exists"""
        return RestaurantCommissionConfig.objects.count() < 1

    def has_delete_permission(self, request, obj=None):
        """Prevent deleting active config"""
        if obj and obj.is_active:
            return False
        return True
