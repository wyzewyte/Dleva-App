from django.urls import path
from . import views, auth_views, assignment_views, delivery_views, payout_views, dispute_views, wallet_views, rating_views, realtime_views

urlpatterns = [
    # ==================== AUTH ====================
    path('register/', auth_views.register_rider, name='register'),
    path('login/', auth_views.login_rider, name='login'),
    path('logout/', views.logout_rider, name='logout'),
    path('request-phone-otp/', auth_views.request_phone_otp, name='request-phone-otp'),
    path('resend-phone-otp/', auth_views.resend_phone_otp, name='resend-phone-otp'),
    path('resend-registration-otp/', auth_views.resend_registration_otp, name='resend-registration-otp'),
    path('verify-phone-otp/', auth_views.verify_phone_otp, name='verify-phone-otp'),
    
    # ==================== PROFILE ====================
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/update/', views.ProfileView.as_view(), name='profile-update'),
    path('profile/verification-status/', views.verification_status, name='verification-status'),
    path('profile/toggle-online/', views.toggle_online_status, name='toggle-online'),
    path('profile/update-location/', realtime_views.update_rider_location, name='update-location'),
    
    # ==================== DOCUMENTS ====================
    path('documents/upload/', views.upload_document, name='upload-document'),
    path('documents/status/', views.document_status, name='document-status'),
    
    # ==================== BANK DETAILS ====================
    path('bank/add/', views.add_bank_details, name='add-bank-details'),
    path('bank/details/', views.get_bank_details, name='get-bank-details'),
    path('bank/banks/', views.list_banks, name='list-banks'),
    path('bank/resolve/', views.resolve_bank_account, name='resolve-bank-account'),
    
    # ==================== ORDERS ====================
    path('orders/', views.list_rider_orders, name='rider-orders'),
    path('order/<int:order_id>/status/', views.get_order_status, name='order-status'),
    
    # ==================== DELIVERY FEE ESTIMATION ====================
    path('estimate-delivery-fee/', views.estimate_delivery_fee, name='estimate-delivery-fee'),
    
    # ==================== WALLET ====================
    path('wallet/', views.WalletView.as_view(), name='wallet'),
    path('wallet/transactions/', views.list_transactions, name='transactions'),
    path('wallet/withdraw/', views.withdraw_funds, name='withdraw-funds'),
    
    # ==================== PHASE 3: ASSIGNMENT ====================
    path('available-orders/', assignment_views.get_available_orders, name='available-orders'),
    path('order/<int:order_id>/accept/', assignment_views.accept_delivery_order, name='accept-order'),
    path('order/<int:order_id>/reject/', assignment_views.reject_delivery_order, name='reject-order'),
    
    # ==================== PHASE 4: DELIVERY LIFECYCLE ====================
    path('order/<int:order_id>/arrived-at-pickup/', delivery_views.arrived_at_pickup, name='arrived-at-pickup'),
    path('order/<int:order_id>/release/', delivery_views.release_order, name='release-order'),
    path('order/<int:order_id>/pickup/', delivery_views.pickup_order, name='pickup-order'),
    path('order/<int:order_id>/on-the-way/', delivery_views.on_the_way, name='on-the-way'),
    path('order/<int:order_id>/delivery-attempted/', delivery_views.delivery_attempted, name='delivery-attempted'),
    path('order/<int:order_id>/deliver/', delivery_views.verify_and_deliver, name='verify-and-deliver'),
    path('order/<int:order_id>/cancel/', delivery_views.cancel_delivery, name='cancel-delivery'),
    path('order/<int:order_id>/update-location/', delivery_views.update_rider_location, name='update-location'),
    path('order/<int:order_id>/delivery-status/', delivery_views.delivery_status, name='delivery-status'),
    
    # ==================== PHASE 5: WALLET & PAYOUTS ====================
    path('wallet/info/', wallet_views.wallet_info, name='wallet-info'),
    path('wallet/earnings/today/', wallet_views.earnings_today, name='earnings-today'),
    path('wallet/earnings/weekly/', wallet_views.earnings_weekly, name='earnings-weekly'),
    path('wallet/transactions/', wallet_views.transaction_history, name='transaction-history'),
    path('wallet/summary/', wallet_views.earnings_summary, name='earnings-summary'),
    
    # ==================== PHASE 5: PAYOUT ====================
    path('payout/request/', payout_views.request_withdrawal, name='request-withdrawal'),
    path('payout/history/', payout_views.payout_history, name='payout-history'),
    
    # ==================== PHASE 5: DISPUTES ====================
    path('disputes/lodge/<int:order_id>/', dispute_views.lodge_dispute, name='lodge-dispute'),
    path('disputes/<int:dispute_id>/status/', dispute_views.dispute_status, name='dispute-status'),
    path('disputes/my-disputes/', dispute_views.my_disputes, name='my-disputes'),
    
    # ==================== ADMIN PHASE 5: PAYOUTS ====================
    path('admin/payout/<int:payout_id>/approve/', payout_views.admin_approve_payout, name='admin-approve-payout'),
    path('admin/payout/<int:payout_id>/complete/', payout_views.admin_complete_payout, name='admin-complete-payout'),
    path('admin/payout/<int:payout_id>/reject/', payout_views.admin_reject_payout, name='admin-reject-payout'),
    path('admin/rider/<int:rider_id>/freeze-wallet/', payout_views.admin_freeze_wallet, name='admin-freeze-wallet'),
    path('admin/rider/<int:rider_id>/unfreeze-wallet/', payout_views.admin_unfreeze_wallet, name='admin-unfreeze-wallet'),
    path('admin/rider/<int:rider_id>/adjust-wallet/', payout_views.admin_adjust_wallet, name='admin-adjust-wallet'),
    
    # ==================== ADMIN PHASE 5: DISPUTES ====================
    path('admin/disputes/list/', dispute_views.admin_disputes_list, name='admin-disputes-list'),
    path('admin/disputes/<int:dispute_id>/resolve-refund/', dispute_views.admin_resolve_dispute_refund, name='admin-resolve-refund'),
    path('admin/disputes/<int:dispute_id>/resolve-no-action/', dispute_views.admin_resolve_dispute_no_action, name='admin-resolve-no-action'),
    path('admin/disputes/<int:dispute_id>/reject/', dispute_views.admin_reject_dispute, name='admin-reject-dispute'),
    
    # ==================== PHASE 6: RATINGS & PERFORMANCE ====================
    path('order/<int:order_id>/rate-rider/', rating_views.submit_rider_rating, name='submit-rider-rating'),
    path('rider/<int:rider_id>/ratings/', rating_views.get_rider_ratings, name='get-rider-ratings'),
    path('rider/<int:rider_id>/performance/', rating_views.get_rider_performance_stats, name='rider-performance-stats'),
    
    # ==================== ADMIN PHASE 6: PERFORMANCE DASHBOARD ====================
    path('admin/riders/performance/', rating_views.admin_get_all_riders_performance, name='admin-all-riders-performance'),
    path('admin/rider/<int:rider_id>/deactivate/', rating_views.admin_deactivate_rider, name='admin-deactivate-rider'),
    path('admin/rider/<int:rider_id>/reactivate/', rating_views.admin_reactivate_rider, name='admin-reactivate-rider'),
    path('admin/riders/reactivate-suspended/', rating_views.admin_check_and_reactivate_suspended, name='admin-reactivate-suspended'),
    
    # ==================== PHASE 7: REAL-TIME INFRASTRUCTURE ====================
    # Notifications
    path('notifications/unread/', realtime_views.get_unread_notifications, name='get-unread-notifications'),
    path('notifications/<int:notification_id>/read/', realtime_views.mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', realtime_views.mark_all_notifications_read, name='mark-all-notifications-read'),
    path('notifications/history/', realtime_views.get_notifications_history, name='notifications-history'),
    
    # Location & Tracking
    path('location/current/<int:rider_id>/', realtime_views.get_current_location, name='get-current-location'),
    path('location/start-tracking/', realtime_views.start_location_tracking, name='start-location-tracking'),
    path('fcm-token/register/', realtime_views.register_fcm_token, name='register-fcm-token'),
    
    # Order Subscription
    path('order/<int:order_id>/subscribe/', realtime_views.subscribe_to_order, name='subscribe-to-order'),
    
    # ==================== SERVICE AREAS ====================
    path('service-areas/available/', views.get_available_service_areas, name='available-service-areas'),
    path('service-areas/my-areas/', views.get_rider_service_areas, name='my-service-areas'),
    path('service-areas/set/', views.set_rider_service_areas, name='set-service-areas'),
]
