"""
Phase 5: Payout Service
Handles withdrawal requests and payout processing
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from rider.models import RiderProfile, RiderWallet, RiderTransaction, PayoutRequest


class PayoutError(Exception):
    """Raised when payout operation is invalid"""
    pass


class PayoutService:
    """
    Manages rider payouts and withdrawals.
    
    Rules:
    - Minimum payout: ₦2000
    - Can withdraw from available_balance only (pending is on 24-hour hold)
    - Wallet must not be frozen
    - One withdrawal per day cooldown
    - Cannot withdraw if open disputes exist
    """
    
    MINIMUM_PAYOUT = Decimal('2000.00')
    WITHDRAWAL_COOLDOWN_HOURS = 24
    
    @staticmethod
    def request_payout(rider_id: int, amount: Decimal) -> dict:
        """
        Rider requests withdrawal/payout.
        
        Validations:
        - Available balance must be >= amount
        - Minimum payout ≥ ₦2000
        - Wallet not frozen
        - Bank details registered
        - One withdrawal per 24 hours
        - No open disputes
        
        Returns: PayoutRequest object details
        """
        try:
            rider = RiderProfile.objects.get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PayoutError("Rider not found")
        
        try:
            wallet = RiderWallet.objects.get(rider=rider)
        except RiderWallet.DoesNotExist:
            raise PayoutError("Wallet not found")
        
        # Validation checks
        if wallet.is_frozen:
            raise PayoutError(
                f"Wallet is frozen: {wallet.frozen_reason or 'No reason provided'}"
            )
        
        if amount < PayoutService.MINIMUM_PAYOUT:
            raise PayoutError(
                f"Minimum payout is ₦{PayoutService.MINIMUM_PAYOUT}"
            )
        
        if wallet.available_balance < amount:
            raise PayoutError(
                f"Insufficient available balance. "
                f"Available: ₦{wallet.available_balance}, "
                f"Requested: ₦{amount}"
            )
        
        # Check bank details registered
        if not hasattr(rider, 'bank_details') or not rider.bank_details:
            raise PayoutError("Bank details not registered")
        
        # Check cooldown - one withdrawal per 24 hours
        if wallet.last_withdrawal_date:
            time_since_last = timezone.now() - wallet.last_withdrawal_date
            if time_since_last < timedelta(hours=PayoutService.WITHDRAWAL_COOLDOWN_HOURS):
                hours_remaining = (
                    PayoutService.WITHDRAWAL_COOLDOWN_HOURS - 
                    (time_since_last.total_seconds() / 3600)
                )
                raise PayoutError(
                    f"Withdrawal cooldown active. "
                    f"Try again in {hours_remaining:.1f} hours"
                )
        
        # Check for open disputes
        from buyer.models import Order
        open_disputes = Order.objects.filter(
            rider=rider.user,
            disputes__status__in=['open', 'under_review']
        ).count()
        
        if open_disputes > 0:
            raise PayoutError(
                f"Cannot withdraw while {open_disputes} dispute(s) are open"
            )
        
        # Create payout request
        bank = rider.bank_details
        payout_request = PayoutRequest.objects.create(
            rider=rider,
            amount=amount,
            status='pending',
            bank_name=bank.bank_name,
            account_number=bank.account_number,
            account_name=bank.account_name,
        )
        
        return {
            'status': 'success',
            'message': 'Payout request created - awaiting admin approval',
            'payout_id': payout_request.id,
            'amount': str(payout_request.amount),
            'bank_name': payout_request.bank_name,
            'account_number': f"****{payout_request.account_number[-4:]}",  # Masked
            'requested_at': payout_request.requested_at.isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def approve_payout(payout_id: int, admin_user) -> dict:
        """
        Admin approves a payout request.
        Does NOT deduct money yet - just approves.
        
        Money will be deducted when marked as 'completed'
        """
        try:
            payout = PayoutRequest.objects.select_for_update().get(id=payout_id)
        except PayoutRequest.DoesNotExist:
            raise PayoutError("Payout request not found")
        
        if payout.status != 'pending':
            raise PayoutError(f"Cannot approve payout with status: {payout.status}")
        
        # Verify rider still has sufficient balance
        wallet = RiderWallet.objects.get(rider=payout.rider)
        if wallet.available_balance < payout.amount:
            raise PayoutError("Insufficient balance - rider may have withdrawn elsewhere")
        
        payout.status = 'approved'
        payout.approved_by = admin_user
        payout.approved_at = timezone.now()
        payout.save()
        
        return {
            'status': 'success',
            'message': 'Payout approved - ready for completion',
            'payout_id': payout.id,
            'amount': str(payout.amount),
            'approved_at': payout.approved_at.isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def complete_payout(payout_id: int) -> dict:
        """
        Mark payout as completed and deduct from wallet.
        Should be called after bank transfer is confirmed.
        
        Actions:
        - Deduct from available_balance
        - Create withdrawal transaction
        - Update last_withdrawal_date
        - Mark as completed
        """
        try:
            payout = PayoutRequest.objects.select_for_update().get(id=payout_id)
        except PayoutRequest.DoesNotExist:
            raise PayoutError("Payout request not found")
        
        if payout.status != 'approved':
            raise PayoutError(f"Can only complete approved payouts, status: {payout.status}")
        
        wallet = RiderWallet.objects.select_for_update().get(rider=payout.rider)
        
        # Final check
        if wallet.available_balance < payout.amount:
            raise PayoutError("Insufficient balance at completion time")
        
        # Deduct from available balance
        wallet.available_balance -= payout.amount
        wallet.total_withdrawn += payout.amount
        wallet.last_withdrawal_date = timezone.now()
        wallet.save()
        
        # Create transaction record
        RiderTransaction.objects.create(
            rider=payout.rider,
            amount=payout.amount,
            transaction_type='withdrawal',
            status='completed',
            description=f'Withdrawal to {payout.bank_name} - {payout.account_name}'
        )
        
        # Mark payout complete
        payout.status = 'completed'
        payout.completed_at = timezone.now()
        payout.save()
        
        return {
            'status': 'success',
            'message': 'Payout completed - funds transferred',
            'payout_id': payout.id,
            'amount': str(payout.amount),
            'bank': payout.bank_name,
            'account': payout.account_name,
            'completed_at': payout.completed_at.isoformat(),
            'new_available_balance': str(wallet.available_balance),
        }
    
    @staticmethod
    @transaction.atomic
    def reject_payout(payout_id: int, reason: str = '') -> dict:
        """
        Admin rejects a payout request.
        Does not affect wallet balance.
        """
        try:
            payout = PayoutRequest.objects.select_for_update().get(id=payout_id)
        except PayoutRequest.DoesNotExist:
            raise PayoutError("Payout request not found")
        
        if payout.status not in ['pending', 'approved']:
            raise PayoutError(f"Cannot reject payout with status: {payout.status}")
        
        payout.status = 'rejected'
        payout.rejection_reason = reason
        payout.save()
        
        return {
            'status': 'success',
            'message': 'Payout rejected',
            'payout_id': payout.id,
            'amount': str(payout.amount),
            'reason': reason,
        }
    
    @staticmethod
    @transaction.atomic
    def freeze_wallet(rider_id: int, admin_user, reason: str) -> dict:
        """
        Admin freezes a rider's wallet (fraud investigation, disputes, etc).
        Frozen wallets cannot withdraw.
        """
        try:
            rider = RiderProfile.objects.get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PayoutError("Rider not found")
        
        wallet = RiderWallet.objects.get(rider=rider)
        
        wallet.is_frozen = True
        wallet.frozen_reason = reason
        wallet.frozen_at = timezone.now()
        wallet.save()
        
        # Log this action
        RiderTransaction.objects.create(
            rider=rider,
            amount=Decimal('0'),
            transaction_type='adjustment',
            status='completed',
            description=f'Wallet frozen by admin: {reason}'
        )
        
        return {
            'status': 'success',
            'message': 'Wallet frozen',
            'rider_id': rider.id,
            'reason': reason,
            'frozen_at': wallet.frozen_at.isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def unfreeze_wallet(rider_id: int, admin_user, reason: str = '') -> dict:
        """
        Admin unfreezes a rider's wallet.
        """
        try:
            rider = RiderProfile.objects.get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PayoutError("Rider not found")
        
        wallet = RiderWallet.objects.get(rider=rider)
        
        wallet.is_frozen = False
        wallet.frozen_reason = ''
        wallet.frozen_at = None
        wallet.save()
        
        # Log this action
        RiderTransaction.objects.create(
            rider=rider,
            amount=Decimal('0'),
            transaction_type='adjustment',
            status='completed',
            description=f'Wallet unfrozen by admin{": " + reason if reason else ""}'
        )
        
        return {
            'status': 'success',
            'message': 'Wallet unfrozen',
            'rider_id': rider.id,
            'unfrozen_at': timezone.now().isoformat(),
        }
    
    @staticmethod
    @transaction.atomic
    def admin_adjust_wallet(rider_id: int, admin_user, amount: Decimal, 
                          adjustment_type: str, reason: str) -> dict:
        """
        Admin makes manual wallet adjustment (bonus, penalty, correction).
        
        adjustment_type: 'bonus' or 'penalty'
        """
        try:
            rider = RiderProfile.objects.get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PayoutError("Rider not found")
        
        if adjustment_type not in ['bonus', 'penalty']:
            raise PayoutError("adjustment_type must be 'bonus' or 'penalty'")
        
        wallet = RiderWallet.objects.select_for_update().get(rider=rider)
        
        # Apply adjustment
        if adjustment_type == 'bonus':
            wallet.available_balance += amount
            wallet.total_earned += amount
            transaction_type = 'bonus'
            desc = f'Admin bonus: {reason}'
        else:  # penalty
            if wallet.available_balance < amount:
                raise PayoutError("Insufficient balance for penalty deduction")
            wallet.available_balance -= amount
            transaction_type = 'penalty'
            desc = f'Admin penalty: {reason}'
        
        wallet.save()
        
        # Create transaction record
        RiderTransaction.objects.create(
            rider=rider,
            amount=amount,
            transaction_type=transaction_type,
            status='completed',
            description=desc,
            admin_note=reason
        )
        
        return {
            'status': 'success',
            'message': f'{adjustment_type.capitalize()} applied',
            'rider_id': rider.id,
            'amount': str(amount),
            'type': adjustment_type,
            'reason': reason,
            'new_balance': str(wallet.available_balance),
        }
    
    @staticmethod
    def move_pending_to_available(hours=24) -> dict:
        """
        Scheduled task: Move earnings from pending to available after 24 hours.
        Run this hourly or daily via celery/management command.
        
        Returns: Number of wallets updated
        """
        from django.db.models import Q
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        # Find wallets with pending balance that's older than 24 hours
        wallets = RiderWallet.objects.filter(
            pending_balance__gt=0,
            updated_at__lt=cutoff_time
        ).select_for_update()
        
        count = 0
        for wallet in wallets:
            # Move from pending to available
            wallet.available_balance += wallet.pending_balance
            wallet.pending_balance = 0
            wallet.save()
            count += 1
        
        return {
            'status': 'success',
            'message': f'Moved {count} wallets from pending to available',
            'wallets_updated': count,
        }
