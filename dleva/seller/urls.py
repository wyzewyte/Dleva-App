from django.urls import path
from . import views
from .views import get_restaurant, update_restaurant, get_payout_details, mark_order_ready_for_delivery
from .cloudinary_views import (
    UploadSellerProfileImageView,
    UploadRestaurantImageView,
    UploadMenuItemImageView,
    DeleteSellerImageView,
    GetOptimizedImageView,
)

urlpatterns = [
    path('register/', views.seller_register, name='seller_register'),
    path('request-phone-otp/', views.request_seller_phone_otp, name='request_seller_phone_otp'),
    path('verify-phone-otp/', views.verify_seller_phone_otp, name='verify_seller_phone_otp'),
    path('request-email-otp/', views.request_seller_email_otp, name='request_seller_email_otp'),
    path('verify-email-otp/', views.verify_seller_email_otp, name='verify_seller_email_otp'),
    path('login/', views.seller_login, name='seller_login'),
    path('profile/', views.get_seller_profile, name='get_seller_profile'),
    path('profile/update/', views.update_seller_profile, name='update_seller_profile'),
    path('menu/', views.seller_menu_list, name='seller_menu_list'),
    path('menu/add/', views.seller_menu_add, name='seller_menu_add'),
    path('menu/<int:pk>/update/', views.seller_menu_update, name='seller_menu_update'),
    path('menu/<int:pk>/delete/', views.seller_menu_delete, name='seller_menu_delete'),
    path('restaurant/create/', views.create_restaurant, name='create_restaurant'),
    path('restaurant/', views.get_restaurant, name='get_restaurant'),
    path('restaurant/update/', views.update_restaurant, name='update_restaurant'),
    path('orders/', views.seller_orders, name='seller_orders'),
    path('order/<int:order_id>/update-status/', views.seller_update_order_status, name='seller_update_order_status'),
    path('analytics/', views.seller_analytics, name='seller_analytics'),
    path('payments/', views.seller_payments, name='seller_payments'),
    path('reviews/', views.seller_reviews, name='seller_reviews'),
    path('restaurant/setup/', views.setup_restaurant, name='setup_restaurant'),
    path('payouts/', views.seller_payouts, name='seller_payouts'),
    path('payout-details/', views.get_payout_details, name='get_payout_details'),
    
    # ==================== PHASE 3: ASSIGNMENT ====================
    path('order/<int:order_id>/mark-ready/', mark_order_ready_for_delivery, name='mark-order-ready'),
    
    # ==================== PHASE 7: NOTIFICATIONS ====================
    path('notifications/', views.get_seller_notifications, name='get_seller_notifications'),
    path('notifications/<int:notification_id>/', views.seller_notification_detail, name='seller_notification_detail'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_as_read, name='mark_notification_read'),
    path('notifications/unread-count/', views.get_unread_notification_count, name='unread_count'),
    path('update-fcm-token/', views.update_seller_fcm_token, name='update_fcm_token'),
    
    # ==================== CLOUDINARY: IMAGE UPLOADS ====================
    path('upload-profile-image/', UploadSellerProfileImageView.as_view(), name='upload-seller-profile-image'),
    path('upload-restaurant-image/', UploadRestaurantImageView.as_view(), name='upload-restaurant-image'),
    path('menu/<int:menu_id>/upload-image/', UploadMenuItemImageView.as_view(), name='upload-menu-item-image'),
    path('delete-image/', DeleteSellerImageView.as_view(), name='delete-seller-image'),
    path('optimized-image/', GetOptimizedImageView.as_view(), name='get-optimized-image'),
]
