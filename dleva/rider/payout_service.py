"""
Phase 5: Payout Service
Handles withdrawal requests and payout processing
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from zoneinfo import ZoneInfo
from rider.models import RiderProfile, RiderWallet, RiderTransaction, PayoutRequest, Dispute


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
    WITHDRAWAL_WEEKDAY = 0  # Monday
    WITHDRAWAL_START_HOUR = 7
    WITHDRAWAL_END_HOUR = 11
    WITHDRAWAL_TIMEZONE = ZoneInfo('Africa/Lagos')

    @classmethod
    def _get_bank_details(cls, rider):
        try:
            return rider.bank_details
        except Exception:
            return None

    @classmethod
    def _lagos_now(cls):
        return timezone.now().astimezone(cls.WITHDRAWAL_TIMEZONE)

    @classmethod
    def _next_withdrawal_window_start(cls, now=None):
        now = now or cls._lagos_now()
        next_start = now.replace(
            hour=cls.WITHDRAWAL_START_HOUR,
            minute=0,
            second=0,
            microsecond=0,
        )

        if now.weekday() < cls.WITHDRAWAL_WEEKDAY:
            next_start = next_start + timedelta(days=cls.WITHDRAWAL_WEEKDAY - now.weekday())
        elif now.weekday() > cls.WITHDRAWAL_WEEKDAY:
            next_start = next_start + timedelta(days=(7 - now.weekday()) + cls.WITHDRAWAL_WEEKDAY)
        elif now.hour >= cls.WITHDRAWAL_END_HOUR:
            next_start = next_start + timedelta(days=7)

        return next_start

    @classmethod
    def get_withdrawal_window_info(cls):
        now = cls._lagos_now()
        current_window_start = now.replace(
            hour=cls.WITHDRAWAL_START_HOUR,
            minute=0,
            second=0,
            microsecond=0,
        )
        current_window_end = now.replace(
            hour=cls.WITHDRAWAL_END_HOUR,
            minute=0,
            second=0,
            microsecond=0,
        )

        is_open = (
            now.weekday() == cls.WITHDRAWAL_WEEKDAY and
            cls.WITHDRAWAL_START_HOUR <= now.hour < cls.WITHDRAWAL_END_HOUR
        )

        return {
            'is_open': is_open,
            'timezone': 'Africa/Lagos',
            'weekday': 'Monday',
            'start_time': '07:00',
            'end_time': '11:00',
            'current_time': now.isoformat(),
            'current_window_start': current_window_start.isoformat(),
            'current_window_end': current_window_end.isoformat(),
            'next_window_start': cls._next_withdrawal_window_start(now).isoformat(),
            'label': 'Monday 7:00 AM - 11:00 AM',
        }

    @classmethod
    @transaction.atomic
    def release_matured_pending_for_rider(cls, rider, hours=24) -> dict:
        """
        Lazily release matured pending earnings for a single rider.

        This is a safety net for environments where the scheduled command
        has not been wired yet. It only releases earnings that:
        - belong to this rider
        - are older than the hold window
        - are not already marked as released
        - are not tied to an order with an open/under_review dispute
        """
        cutoff_time = timezone.now() - timedelta(hours=hours)

        pending_earnings = list(
            RiderTransaction.objects.select_for_update()
            .filter(
                rider=rider,
                transaction_type='delivery_earning',
                created_at__lte=cutoff_time,
            )
            .exclude(admin_note__startswith='released_to_available:')
            .order_by('created_at', 'id')
        )

        if not pending_earnings:
            return {
                'released': False,
                'earnings_released': 0,
                'amount_released': Decimal('0.00'),
            }

        disputed_order_ids = set(
            Dispute.objects.filter(
                order_id__in=[txn.order_id for txn in pending_earnings if txn.order_id],
                status__in=['open', 'under_review'],
            ).values_list('order_id', flat=True)
        )

        wallet = RiderWallet.objects.select_for_update().get(rider=rider)
        released_earnings = 0
        amount_released = Decimal('0.00')
        released_at = timezone.now().isoformat()

        for earning in pending_earnings:
            if earning.order_id in disputed_order_ids:
                continue

            releasable_amount = min(wallet.pending_balance, earning.amount)
            if releasable_amount <= 0:
                continue

            wallet.pending_balance -= releasable_amount
            wallet.available_balance += releasable_amount

            earning.admin_note = f'released_to_available:{released_at}'
            earning.save(update_fields=['admin_note', 'updated_at'])

            released_earnings += 1
            amount_released += releasable_amount

        if released_earnings > 0:
            wallet.save(update_fields=['pending_balance', 'available_balance', 'updated_at'])

        return {
            'released': released_earnings > 0,
            'earnings_released': released_earnings,
            'amount_released': amount_released,
        }

    @classmethod
    def get_withdrawal_context(cls, rider, wallet, amount=None):
        cls.release_matured_pending_for_rider(rider, hours=24)
        wallet.refresh_from_db()
        window = cls.get_withdrawal_window_info()
        blockers = []

        if not window['is_open']:
            blockers.append('Withdrawals are only available on Mondays from 7:00 AM to 11:00 AM Africa/Lagos time.')

        if wallet.is_frozen:
            blockers.append(
                f"Wallet is frozen: {wallet.frozen_reason or 'No reason provided'}"
            )

        bank_details = cls._get_bank_details(rider)
        if not bank_details:
            blockers.append('Bank details not registered')

        if wallet.available_balance < cls.MINIMUM_PAYOUT:
            blockers.append(
                f"Minimum payout is ₦{cls.MINIMUM_PAYOUT}. Current available balance is ₦{wallet.available_balance}"
            )

        if wallet.last_withdrawal_date:
            time_since_last = timezone.now() - wallet.last_withdrawal_date
            if time_since_last < timedelta(hours=cls.WITHDRAWAL_COOLDOWN_HOURS):
                hours_remaining = (
                    cls.WITHDRAWAL_COOLDOWN_HOURS -
                    (time_since_last.total_seconds() / 3600)
                )
                blockers.append(
                    f"Withdrawal cooldown active. Try again in {hours_remaining:.1f} hours"
                )

        from buyer.models import Order
        open_disputes = Order.objects.filter(
            rider=rider,
            disputes__status__in=['open', 'under_review']
        ).count()
        if open_disputes > 0:
            blockers.append(
                f"Cannot withdraw while {open_disputes} dispute(s) are open"
            )

        active_payout = PayoutRequest.objects.filter(
            rider=rider,
            status__in=['pending', 'approved']
        ).order_by('-requested_at').first()
        if active_payout:
            blockers.append(
                f"You already have a {active_payout.status} withdrawal request in progress"
            )

        if amount is not None:
            if amount < cls.MINIMUM_PAYOUT:
                blockers.append(f"Minimum payout is ₦{cls.MINIMUM_PAYOUT}")
            if wallet.available_balance < amount:
                blockers.append(
                    f"Insufficient available balance. Available: ₦{wallet.available_balance}, Requested: ₦{amount}"
                )

        # Keep order stable and avoid duplicate messages.
        unique_blockers = list(dict.fromkeys(blockers))

        return {
            'can_withdraw': len(unique_blockers) == 0,
            'blockers': unique_blockers,
            'window': window,
            'minimum_payout': str(cls.MINIMUM_PAYOUT),
            'withdrawal_cooldown_hours': cls.WITHDRAWAL_COOLDOWN_HOURS,
            'has_bank_details': bool(bank_details),
            'open_disputes': open_disputes,
            'active_payout': active_payout,
        }
    
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

        PayoutService.release_matured_pending_for_rider(rider, hours=24)
        wallet.refresh_from_db()
        
        context = PayoutService.get_withdrawal_context(rider, wallet, amount=amount)
        if not context['can_withdraw']:
            raise PayoutError(context['blockers'][0])
        
        # Create payout request
        bank = PayoutService._get_bank_details(rider)
        if not bank:
            raise PayoutError("Bank details not registered")
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
            'status': payout_request.status,
            'bank_name': payout_request.bank_name,
            'account_number': f"****{payout_request.account_number[-4:]}",  # Masked
            'requested_at': payout_request.requested_at.isoformat(),
            'withdrawal_window': context['window'],
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
        
        Rules:
        - Only release delivery earnings older than the hold window
        - Skip orders that still have open/under_review disputes
        - Never release the same earning twice
        
        Returns: Summary of released earnings
        """
        cutoff_time = timezone.now() - timedelta(hours=hours)

        pending_earnings = list(
            RiderTransaction.objects.select_for_update()
            .filter(
                transaction_type='delivery_earning',
                created_at__lte=cutoff_time,
            )
            .exclude(admin_note__startswith='released_to_available:')
            .order_by('created_at', 'id')
        )

        if not pending_earnings:
            return {
                'status': 'success',
                'message': 'No eligible pending earnings found',
                'wallets_updated': 0,
                'earnings_released': 0,
                'amount_released': '0.00',
            }

        disputed_order_ids = set(
            Dispute.objects.filter(
                order_id__in=[txn.order_id for txn in pending_earnings if txn.order_id],
                status__in=['open', 'under_review'],
            ).values_list('order_id', flat=True)
        )

        updated_wallet_ids = set()
        released_earnings = 0
        amount_released = Decimal('0.00')

        for earning in pending_earnings:
            if earning.order_id in disputed_order_ids:
                continue

            wallet = RiderWallet.objects.select_for_update().get(rider=earning.rider)
            releasable_amount = min(wallet.pending_balance, earning.amount)

            if releasable_amount <= 0:
                continue

            wallet.pending_balance -= releasable_amount
            wallet.available_balance += releasable_amount
            wallet.save(update_fields=['pending_balance', 'available_balance', 'updated_at'])

            earning.admin_note = f'released_to_available:{timezone.now().isoformat()}'
            earning.save(update_fields=['admin_note', 'updated_at'])

            updated_wallet_ids.add(wallet.id)
            released_earnings += 1
            amount_released += releasable_amount

        return {
            'status': 'success',
            'message': f'Released {released_earnings} pending earning(s) across {len(updated_wallet_ids)} wallet(s)',
            'wallets_updated': len(updated_wallet_ids),
            'earnings_released': released_earnings,
            'amount_released': str(amount_released),
        }
