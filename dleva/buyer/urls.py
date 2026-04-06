from django.urls import path
from . import views, auth_views

urlpatterns = [
    # ==================== AUTH ====================
    path('register/', auth_views.register_buyer, name='register'),
    path('login/', auth_views.login_buyer, name='login'),
    path('logout/', views.logout_buyer, name='logout'),
    
    # ==================== PROFILE ====================
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/update/', views.ProfileView.as_view(), name='profile-update'),
    path('change-password/', views.change_password, name='change-password'),
    path('push-token/', views.update_buyer_fcm_token, name='buyer-update-push-token'),
    
    # ==================== RESTAURANTS ====================
    path('restaurants/', views.list_restaurants, name='restaurant-list'),
    path('restaurants/<int:restaurant_id>/', views.get_restaurant, name='restaurant-detail'),
    
    # ==================== MENU ====================
    path('menu/', views.MenuItemListView.as_view(), name='menu-items'),
    path('menu/categories/', views.list_menu_item_categories, name='menu-categories'),
    
    # ==================== CART ====================
    path('cart/', views.CartListView.as_view(), name='cart-list'),
    path('cart/add/', views.AddToCartView.as_view(), name='add-to-cart'),
    path('cart/<int:restaurant_id>/clear/', views.clear_cart, name='clear-cart'),
    
    # ==================== ORDERS ====================
    path('orders/', views.list_orders, name='order-list'),
    path('order-status/<int:order_id>/', views.get_order_status, name='order-status'),
    path('checkout/', views.checkout, name='checkout'),
    
    # ==================== RATINGS ====================
    path('rate/', views.RateOrderView.as_view(), name='rate-order'),


    # ==================== WAITLIST ====================
    path('waitlist/', views.join_platform_waitlist, name='platform-waitlist'),
    
    # ==================== LOCATION ====================
    path('location/', views.save_location, name='buyer-save-location'),
    
    # ==================== GPS TRACKING ====================
    path('gps/location/update/', views.GpsLocationUpdateView.as_view(), name='gps-update'),
    path('gps/location/current/', views.GpsLocationRetrieveView.as_view(), name='gps-current'),

    # ==================== ADDRESS VALIDATION ====================
    path('address/search/', views.AddressSearchView.as_view(), name='address-search'),
    path('address/reverse-geocode/', views.ReverseGeocodeView.as_view(), name='reverse-geocode'),
    path('address/validate/', views.ValidateAddressView.as_view(), name='validate-address'),

    # ==================== PAYMENTS ====================
    path('payment/initialize/', views.InitializePaymentView.as_view(), name='init-payment'),
    path('payment/initialize/<int:order_id>/', views.InitializePaymentView.as_view(), name='init-payment-with-order'),
    path('payment/verify/<int:order_id>/', views.VerifyPaymentView.as_view(), name='verify-payment'),
    path('payment/complete/', views.PaymentCompleteView.as_view(), name='payment-complete'),
]
