from django.contrib import admin
from django.utils import timezone
from .models import (
    RiderProfile, RiderDocument, RiderWallet, 
    RiderTransaction, RiderRating, RiderOrder,
    RiderBankDetails, RiderOTP, PayoutRequest, Dispute,
    RiderNotification,  # Phase 7
    RiderServiceArea  # Service area management
)
from rider.performance_service import PerformanceService



@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'get_email_display', 'phone_number', 'vehicle_type', 'account_status', 'verification_status', 'phone_verified', 'profile_completion_percent', 'is_online', 'average_rating', 'total_deliveries')
    list_filter = ('account_status', 'verification_status', 'phone_verified', 'is_online', 'vehicle_type', 'created_at')
    search_fields = ('full_name', 'email', 'phone_number', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'total_deliveries', 'average_rating', 'profile_completion_percent', 'user')
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'full_name', 'email', 'phone_number', 'phone_verified')
        }),
        ('Vehicle Info', {
            'fields': ('vehicle_type', 'vehicle_plate_number')
        }),
        ('Profile', {
            'fields': ('profile_photo', 'profile_completion_percent')
        }),
        ('Account Status', {
            'fields': ('account_status', 'is_verified', 'verification_status')
        }),
        ('Location', {
            'fields': ('is_online', 'current_latitude', 'current_longitude')
        }),
        ('Performance Metrics', {
            'fields': ('average_rating', 'total_deliveries', 'acceptance_rate', 'on_time_rate')
        }),
        ('Suspension & Warnings (Phase 6)', {
            'fields': ('warning_issued_at', 'suspension_start_date', 'suspension_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def approve_rider(self, request, queryset):
        queryset.update(is_verified=True, verification_status='approved', account_status='approved')
    approve_rider.short_description = "Approve selected riders"

    def reject_rider(self, request, queryset):
        queryset.update(is_verified=False, verification_status='rejected', account_status='rejected')
    reject_rider.short_description = "Reject selected riders"

    def freeze_rider(self, request, queryset):
        queryset.update(is_online=False)
    freeze_rider.short_description = "Freeze selected riders (offline)"

    def get_email_display(self, obj):
        """Display email from RiderProfile or User account"""
        if obj.email and obj.email.strip():
            return obj.email
        return obj.user.email if obj.user else '—'
    get_email_display.short_description = 'Email'

    def save_model(self, request, obj, form, change):
        """Override save to sync email with User account"""
        # If email was changed in RiderProfile, sync it with User
        if obj.email and obj.user:
            obj.user.email = obj.email
            obj.user.save()
        super().save_model(request, obj, form, change)

    def deactivate_rider(self, request, queryset):
        """Permanently deactivate riders"""
        for rider in queryset:
            try:
                PerformanceService.admin_deactivate_rider(
                    rider.user.id,
                    admin_user=request.user,
                    reason="Deactivated via admin action"
                )
            except Exception as e:
                self.message_user(request, f"Error deactivating {rider.full_name}: {str(e)}", level="error")
        self.message_user(request, f"Deactivated {queryset.count()} riders")
    deactivate_rider.short_description = "Deactivate selected riders (permanent)"

    def reactivate_rider(self, request, queryset):
        """Reactivate deactivated riders"""
        for rider in queryset:
            try:
                PerformanceService.admin_reactivate_rider(rider.user.id, admin_user=request.user)
            except Exception as e:
                self.message_user(request, f"Error reactivating {rider.full_name}: {str(e)}", level="error")
        self.message_user(request, f"Reactivated {queryset.count()} riders")
    reactivate_rider.short_description = "Reactivate selected riders"

    actions = [approve_rider, reject_rider, freeze_rider, deactivate_rider, reactivate_rider]


@admin.register(RiderDocument)
class RiderDocumentAdmin(admin.ModelAdmin):
    list_display = ('rider', 'document_type', 'status', 'uploaded_at', 'reviewed_at')
    list_filter = ('status', 'document_type', 'uploaded_at')
    search_fields = ('rider__full_name', 'document_type')
    readonly_fields = ('uploaded_at', 'reviewed_at')
    fieldsets = (
        ('Document Info', {
            'fields': ('rider', 'document_type', 'file')
        }),
        ('Status', {
            'fields': ('status', 'reviewed_by_admin', 'reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('uploaded_at',),
            'classes': ('collapse',)
        }),
    )

    def approve_document(self, request, queryset):
        queryset.update(status='approved', reviewed_by_admin=request.user, reviewed_at=timezone.now())
    approve_document.short_description = "Approve selected documents"

    def reject_document(self, request, queryset):
        queryset.update(status='rejected', reviewed_by_admin=request.user, reviewed_at=timezone.now())
    reject_document.short_description = "Reject selected documents"

    actions = [approve_document, reject_document]


@admin.register(RiderWallet)
class RiderWalletAdmin(admin.ModelAdmin):
    list_display = ('rider', 'available_balance', 'pending_balance', 'total_earned', 'total_withdrawn', 'is_frozen', 'last_payout_date')
    list_filter = ('is_frozen', 'last_payout_date', 'created_at')
    search_fields = ('rider__full_name',)
    readonly_fields = ('created_at', 'updated_at', 'total_earned', 'total_withdrawn')
    fieldsets = (
        ('Rider', {
            'fields': ('rider',)
        }),
        ('Balance', {
            'fields': ('available_balance', 'pending_balance')
        }),
        ('Freeze Status', {
            'fields': ('is_frozen', 'frozen_reason', 'frozen_at')
        }),
        ('History', {
            'fields': ('total_earned', 'total_withdrawn', 'last_payout_date', 'last_withdrawal_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def freeze_wallet(self, request, queryset):
        import datetime
        from django.utils import timezone
        queryset.update(is_frozen=True, frozen_at=timezone.now())
    freeze_wallet.short_description = "Freeze selected wallets"
    
    def unfreeze_wallet(self, request, queryset):
        queryset.update(is_frozen=False, frozen_at=None, frozen_reason='')
    unfreeze_wallet.short_description = "Unfreeze selected wallets"
    
    actions = [freeze_wallet, unfreeze_wallet]


@admin.register(RiderTransaction)
class RiderTransactionAdmin(admin.ModelAdmin):
    list_display = ('rider', 'transaction_type', 'amount', 'status', 'order', 'created_at')
    list_filter = ('status', 'transaction_type', 'created_at')
    search_fields = ('rider__full_name', 'order__id')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Transaction Info', {
            'fields': ('rider', 'order', 'amount', 'transaction_type', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RiderRating)
class RiderRatingAdmin(admin.ModelAdmin):
    list_display = ('rider', 'order', 'rating', 'rated_by', 'created_at')
    list_filter = ('rating', 'rated_by', 'created_at')
    search_fields = ('rider__full_name', 'order__id', 'comment')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Rating', {
            'fields': ('rider', 'order', 'rating', 'rated_by')
        }),
        ('Comment', {
            'fields': ('comment',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(RiderOrder)
class RiderOrderAdmin(admin.ModelAdmin):
    list_display = ('order', 'rider', 'status', 'assigned_at', 'responded_at', 'distance_at_assignment')
    list_filter = ('status', 'assigned_at', 'responded_at')
    search_fields = ('rider__full_name', 'order__id')
    readonly_fields = ('assigned_at',)
    fieldsets = (
        ('Assignment', {
            'fields': ('order', 'rider', 'status')
        }),
        ('Response', {
            'fields': ('assigned_at', 'responded_at')
        }),
        ('Metrics', {
            'fields': ('distance_at_assignment', 'assignment_score')
        }),
    )


@admin.register(RiderBankDetails)
class RiderBankDetailsAdmin(admin.ModelAdmin):
    list_display = ('rider', 'bank_name', 'bank_code', 'verified', 'created_at')
    list_filter = ('verified', 'created_at')
    search_fields = ('rider__full_name', 'bank_name', 'bank_code', 'account_number')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Rider', {
            'fields': ('rider',)
        }),
        ('Bank Details', {
            'fields': ('bank_code', 'bank_name', 'account_name', 'account_number')
        }),
        ('Status', {
            'fields': ('verified',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RiderServiceArea)
class RiderServiceAreaAdmin(admin.ModelAdmin):
    list_display = ('get_rider_name', 'area_name', 'is_selected', 'added_at')
    list_filter = ('area_code', 'is_selected', 'added_at')
    search_fields = ('rider__full_name', 'area_name', 'area_code')
    readonly_fields = ('added_at', 'updated_at')
    fieldsets = (
        ('Rider & Area', {
            'fields': ('rider', 'area_code', 'area_name')
        }),
        ('Status', {
            'fields': ('is_selected',)
        }),
        ('Timestamps', {
            'fields': ('added_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_rider_name(self, obj):
        return obj.rider.full_name
    get_rider_name.short_description = 'Rider'


@admin.register(RiderOTP)
class RiderOTPAdmin(admin.ModelAdmin):
    list_display = ('rider', 'phone_number', 'is_verified', 'attempts', 'created_at', 'expires_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('rider__full_name', 'phone_number')
    readonly_fields = ('created_at', 'otp_code')
    fieldsets = (
        ('Rider Info', {
            'fields': ('rider', 'phone_number')
        }),
        ('OTP', {
            'fields': ('otp_code', 'is_verified', 'attempts')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PayoutRequest)
class PayoutRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'rider', 'amount', 'status', 'requested_at', 'approved_at')
    list_filter = ('status', 'requested_at', 'approved_at')
    search_fields = ('rider__full_name', 'account_number')
    readonly_fields = ('requested_at', 'updated_at')
    fieldsets = (
        ('Rider & Amount', {
            'fields': ('rider', 'amount', 'status')
        }),
        ('Bank Details (Snapshot)', {
            'fields': ('bank_name', 'account_name', 'account_number')
        }),
        ('Admin Actions', {
            'fields': ('approved_by', 'approved_at', 'rejection_reason', 'completed_at')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def approve_payout(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='pending').update(status='approved', approved_by=request.user, approved_at=timezone.now())
    approve_payout.short_description = "Approve selected payouts"
    
    def complete_payout(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='approved').update(status='completed', completed_at=timezone.now())
    complete_payout.short_description = "Mark as completed"
    
    def reject_payout(self, request, queryset):
        queryset.filter(status='pending').update(status='rejected')
    reject_payout.short_description = "Reject selected payouts"
    
    actions = [approve_payout, complete_payout, reject_payout]


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ('order', 'lodged_by_type', 'reason', 'status', 'admin_decision', 'lodged_at')
    list_filter = ('status', 'admin_decision', 'reason', 'lodged_by_type', 'lodged_at')
    search_fields = ('order__id', 'lodged_by__username', 'description')
    readonly_fields = ('lodged_at', 'reviewed_at')
    fieldsets = (
        ('Dispute Info', {
            'fields': ('order', 'lodged_by_type', 'lodged_by', 'reason', 'description')
        }),
        ('Evidence', {
            'fields': ('evidence_photo',)
        }),
        ('Status & Decision', {
            'fields': ('status', 'admin_decision', 'admin_note')
        }),
        ('Refund (if applicable)', {
            'fields': ('refund_amount', 'refund_reason', 'refund_processed_at'),
            'classes': ('collapse',)
        }),
        ('Penalty (if applicable)', {
            'fields': ('penalty_amount', 'penalty_type'),
            'classes': ('collapse',)
        }),
        ('Timeline', {
            'fields': ('lodged_at', 'reviewed_by', 'reviewed_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )
    
    def approve_refund(self, request, queryset):
        from django.utils import timezone
        for dispute in queryset.filter(status='open'):
            dispute.status = 'under_review'
            dispute.admin_decision = 'full_refund'
            dispute.reviewed_by = request.user
            dispute.reviewed_at = timezone.now()
            dispute.save()
    approve_refund.short_description = "Approve full refund"
    
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='resolved', resolved_at=timezone.now())
    mark_resolved.short_description = "Mark as resolved"
    
    def mark_rejected(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='rejected', resolved_at=timezone.now())
    mark_rejected.short_description = "Reject dispute"
    
    actions = [approve_refund, mark_resolved, mark_rejected]


# ============================================================================
# PHASE 7: REAL-TIME INFRASTRUCTURE
# ============================================================================


@admin.register(RiderNotification)
class RiderNotificationAdmin(admin.ModelAdmin):
    list_display = ('rider', 'get_type_display', 'title', 'is_sent', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_sent', 'is_read', 'created_at')
    search_fields = ('rider__full_name', 'title', 'message')
    readonly_fields = ('created_at', 'sent_at', 'read_at')
    fieldsets = (
        ('Notification', {
            'fields': ('rider', 'notification_type', 'title', 'message')
        }),
        ('Related', {
            'fields': ('related_order',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_sent', 'sent_at', 'is_read', 'read_at')
        }),
        ('Data', {
            'fields': ('data', 'fcm_token'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_type_display(self, obj):
        return obj.get_notification_type_display()
    get_type_display.short_description = 'Type'


