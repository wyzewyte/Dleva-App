"""
Phase 5: Dispute Service
Handles order disputes from buyers, sellers, and riders
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from buyer.models import Order
from rider.models import Dispute, RiderProfile, RiderWallet, RiderTransaction


class DisputeError(Exception):
    """Raised when dispute operation is invalid"""
    pass


class DisputeService:
    """
    Manages dispute system.
    
    Rules:
    - Dispute must be lodged within 7 days after delivery
    - Only buyer, seller, or rider can lodge
    - Admin reviews and makes decision
    - Can result in refunds or penalties
    - Prevents money movement during dispute (wallet frozen)
    """
    
    DISPUTE_WINDOW_DAYS = 7
    
    @staticmethod
    @transaction.atomic
    def lodge_dispute(order_id: int, user_id: int, user_type: str,
                     reason: str, description: str, photo_url: str = '') -> dict:
        """
        Lodge a dispute for an order within 7 days of delivery.
        
        Args:
        - order_id: Order ID
        - user_id: User ID of person lodging dispute
        - user_type: 'buyer', 'seller', 'rider'
        - reason: Predefined reason code
        - description: Detailed explanation
        - photo_url: Optional evidence photo
        
        Returns: Dispute details
        """
        valid_user_types = ['buyer', 'seller', 'rider']
        if user_type not in valid_user_types:
            raise DisputeError(f"user_type must be one of {valid_user_types}")
        
        valid_reasons = [
            'quality_issue', 'delivery_delay', 'incomplete_order',
            'wrong_order', 'rider_misconduct', 'seller_issue', 'other'
        ]
        if reason not in valid_reasons:
            raise DisputeError(f"reason must be one of {valid_reasons}")
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise DisputeError("Order not found")
        
        # Check if order is delivered
        if order.status != 'delivered':
            raise DisputeError(f"Can only dispute delivered orders (current status: {order.status})")
        
        # Check if within 7-day window
        if not order.delivered_at:
            raise DisputeError("Order delivery date not recorded")
        
        days_since_delivery = (timezone.now() - order.delivered_at).days
        if days_since_delivery > DisputeService.DISPUTE_WINDOW_DAYS:
            raise DisputeError(
                f"Dispute window closed. "
                f"Must lodge within {DisputeService.DISPUTE_WINDOW_DAYS} days of delivery. "
                f"({days_since_delivery} days have passed)"
            )
        
        # Check if dispute already exists
        existing = Dispute.objects.filter(order=order, status='open').first()
        if existing:
            raise DisputeError("Open dispute already exists for this order")
        
        # Get user object
        from django.contrib.auth.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise DisputeError("User not found")
        
        # Create dispute
        dispute = Dispute.objects.create(
            order=order,
            lodged_by=user,
            lodged_by_type=user_type,
            reason=reason,
            description=description,
            evidence_photo=photo_url,
            status='open',
            admin_decision='pending',
        )
        
        # Freeze rider wallet if not already frozen
        if user_type != 'rider' and order.rider:
            try:
                rider = RiderProfile.objects.get(user=order.rider)
                wallet = RiderWallet.objects.get(rider=rider)
                
                if not wallet.is_frozen:
                    wallet.is_frozen = True
                    wallet.frozen_reason = f"Dispute #{dispute.id} opened"
                    wallet.frozen_at = timezone.now()
                    wallet.save()
            except:
                pass  # If rider doesn't exist, just continue
        
        return {
            'status': 'success',
            'message': 'Dispute lodged successfully',
            'dispute_id': dispute.id,
            'order_id': dispute.order.id,
            'lodged_by': user_type,
            'reason': dispute.reason,
            'lodged_at': dispute.lodged_at.isoformat(),
            'note': 'Rider wallet frozen during dispute review' if order.rider else '',
        }
    
    @staticmethod
    @transaction.atomic
    def resolve_dispute_with_refund(dispute_id: int, admin_user, 
                                   refund_amount: Decimal, reason: str) -> dict:
        """
        Admin resolves dispute by issuing refund.
        
        Refund can be:
        - Full refund (full delivery fee)
        - Partial refund (partial delivery fee)
        
        Refund goes to buyer's original payment method.
        """
        try:
            dispute = Dispute.objects.select_for_update().get(id=dispute_id)
        except Dispute.DoesNotExist:
            raise DisputeError("Dispute not found")
        
        if dispute.status != 'open':
            raise DisputeError(f"Can only resolve open disputes (status: {dispute.status})")
        
        order = dispute.order
        
        # Determine penalty amount for rider (if refund is full)
        if refund_amount >= order.delivery_fee:
            penalty_amount = order.rider_earning  # Rider loses all earning
        else:
            # Partial refund - proportional penalty
            refund_ratio = refund_amount / order.delivery_fee
            penalty_amount = order.rider_earning * refund_ratio
        
        # Apply refund logic
        dispute.status = 'resolved'
        dispute.admin_decision = 'full_refund' if refund_amount >= order.delivery_fee else 'partial_refund'
        dispute.refund_amount = refund_amount
        dispute.refund_reason = reason
        dispute.refund_processed_at = timezone.now()
        dispute.reviewed_by = admin_user
        dispute.reviewed_at = timezone.now()
        dispute.admin_note = f"Refund: ₦{refund_amount}, Reason: {reason}"
        dispute.save()
        
        # Deduct penalty from rider's pending_balance first, then available
        if order.rider and penalty_amount > 0:
            try:
                rider = RiderProfile.objects.get(user=order.rider)
                wallet = RiderWallet.objects.select_for_update().get(rider=rider)
                
                # Deduct from pending first
                penalty_applied = Decimal('0')
                if wallet.pending_balance > 0:
                    deduct_from_pending = min(wallet.pending_balance, penalty_amount)
                    wallet.pending_balance -= deduct_from_pending
                    penalty_applied += deduct_from_pending
                
                # Then from available
                remaining_penalty = penalty_amount - penalty_applied
                if remaining_penalty > 0 and wallet.available_balance > 0:
                    deduct_from_available = min(wallet.available_balance, remaining_penalty)
                    wallet.available_balance -= deduct_from_available
                    penalty_applied += deduct_from_available
                
                wallet.total_earned -= penalty_applied
                wallet.save()
                
                # Log penalty
                RiderTransaction.objects.create(
                    rider=rider,
                    order=order,
                    amount=penalty_applied,
                    transaction_type='penalty',
                    status='completed',
                    description=f'Dispute penalty - Dispute #{dispute.id}',
                    admin_note=reason
                )
            except:
                pass  # If rider details not found, just continue
        
        # TODO: Process refund to buyer (payment gateway integration)
        # For now, just record it
        
        return {
            'status': 'success',
            'message': 'Dispute resolved with refund',
            'dispute_id': dispute.id,
            'order_id': dispute.order.id,
            'refund_amount': str(refund_amount),
            'rider_penalty': str(penalty_amount) if order.rider else '0',
            'resolved_at': dispute.resolved_at.isoformat() if dispute.resolved_at else timezone.now().isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def resolve_dispute_no_action(dispute_id: int, admin_user, reason: str) -> dict:
        """
        Admin resolves dispute with no action (dismisses it).
        No refund, no penalty.
        """
        try:
            dispute = Dispute.objects.select_for_update().get(id=dispute_id)
        except Dispute.DoesNotExist:
            raise DisputeError("Dispute not found")
        
        if dispute.status != 'open':
            raise DisputeError(f"Can only resolve open disputes")
        
        # Resolve without action
        dispute.status = 'resolved'
        dispute.admin_decision = 'no_action'
        dispute.reviewed_by = admin_user
        dispute.reviewed_at = timezone.now()
        dispute.resolved_at = timezone.now()
        dispute.admin_note = f"Dismissed: {reason}"
        dispute.save()
        
        # Unfreeze wallet
        if dispute.order.rider:
            try:
                rider = RiderProfile.objects.get(user=dispute.order.rider)
                wallet = RiderWallet.objects.get(rider=rider)
                wallet.is_frozen = False
                wallet.frozen_reason = ''
                wallet.frozen_at = None
                wallet.save()
            except:
                pass
        
        return {
            'status': 'success',
            'message': 'Dispute dismissed',
            'dispute_id': dispute.id,
            'decision': 'no_action',
            'reason': reason,
        }
    
    @staticmethod
    @transaction.atomic
    def reject_dispute(dispute_id: int, admin_user, reason: str) -> dict:
        """
        Admin rejects dispute (same as no_action but explicit rejection).
        """
        try:
            dispute = Dispute.objects.select_for_update().get(id=dispute_id)
        except Dispute.DoesNotExist:
            raise DisputeError("Dispute not found")
        
        if dispute.status != 'open':
            raise DisputeError(f"Can only resolve open disputes")
        
        dispute.status = 'rejected'
        dispute.reviewed_by = admin_user
        dispute.reviewed_at = timezone.now()
        dispute.resolved_at = timezone.now()
        dispute.admin_note = f"Rejected: {reason}"
        dispute.save()
        
        # Unfreeze wallet
        if dispute.order.rider:
            try:
                rider = RiderProfile.objects.get(user=dispute.order.rider)
                wallet = RiderWallet.objects.get(rider=rider)
                wallet.is_frozen = False
                wallet.frozen_reason = ''
                wallet.frozen_at = None
                wallet.save()
            except:
                pass
        
        return {
            'status': 'success',
            'message': 'Dispute rejected',
            'dispute_id': dispute.id,
            'reason': reason,
        }
    
    @staticmethod
    def get_dispute_status(dispute_id: int) -> dict:
        """Get dispute details and current status"""
        try:
            dispute = Dispute.objects.get(id=dispute_id)
        except Dispute.DoesNotExist:
            raise DisputeError("Dispute not found")
        
        return {
            'dispute_id': dispute.id,
            'order_id': dispute.order.id,
            'status': dispute.status,
            'reason': dispute.reason,
            'lodged_by': dispute.lodged_by_type,
            'lodged_at': dispute.lodged_at.isoformat(),
            'admin_decision': dispute.admin_decision,
            'admin_note': dispute.admin_note,
            'refund_amount': str(dispute.refund_amount) if dispute.refund_amount else None,
            'resolved_at': dispute.resolved_at.isoformat() if dispute.resolved_at else None,
            'days_since_lodged': (timezone.now() - dispute.lodged_at).days,
        }
