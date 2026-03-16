from django.contrib import admin
from django import forms
from .models import SellerProfile, Restaurant, MenuItem
from django.utils.html import format_html

class RestaurantAdminForm(forms.ModelForm):
    class Meta:
        model = Restaurant
        fields = ['seller', 'name', 'description', 'category', 'address', 'latitude', 'longitude', 'image', 'delivery_fee', 'delivery_time', 'is_active']

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
    list_display = ('restaurant_name', 'user', 'business_type', 'phone')
    search_fields = ('restaurant_name', 'user__username')

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    form = RestaurantAdminForm
    list_display = ['name', 'seller', 'category', 'delivery_time', 'is_active']
    fields = ['seller', 'name', 'description', 'category', 'address', 'latitude', 'longitude', 'image', 'delivery_fee', 'delivery_time', 'is_active']
    search_fields = ['name', 'category']
    list_filter = ['is_active', 'category']

    class Media:
        js = ('admin/js/restaurant_admin.js',)

    def save_model(self, request, obj, form, change):
        # Ensure seller is set
        if not obj.seller and hasattr(request.user, 'seller_profile'):
            obj.seller = request.user.seller_profile
        super().save_model(request, obj, form, change)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'price', 'available', 'image_preview')
    list_filter = ('restaurant', 'available')
    search_fields = ('name',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;border-radius: 8px"/>', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Image'