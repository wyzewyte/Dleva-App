from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    # Location API Endpoints (Phase 2)
    path('api/geocode/', views.geocode_address, name='geocode_address'),
    path('api/reverse-geocode/', views.reverse_geocode_location, name='reverse_geocode'),
    path('api/location/save/', views.save_user_location, name='save_user_location'),
    path('api/location/current/', views.get_current_user_location, name='get_current_location'),
    path('api/location/history/', views.get_location_history, name='get_location_history'),
    path('api/location/recent/', views.get_recent_locations, name='get_recent_locations'),
    path('api/estimate-delivery-fee/', views.estimate_delivery_fee, name='estimate_delivery_fee'),
    path('api/restaurants/', views.get_nearby_restaurants, name='get_nearby_restaurants'),
    # App-specific routes
    path('api/buyer/', include('buyer.urls')),
    path('api/seller/', include('seller.urls')),
    path('api/rider/', include('rider.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)