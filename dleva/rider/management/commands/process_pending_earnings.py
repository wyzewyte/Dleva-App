"""
Django Management Command: Process Pending Earnings
Moves rider earnings from pending_balance to available_balance after 24-hour dispute window.

Usage:
  python manage.py process_pending_earnings
  python manage.py process_pending_earnings --hours=24  (default)
  python manage.py process_pending_earnings --hours=2   (for testing)

This should be scheduled to run daily or hourly via:
  - Django APScheduler
  - Celery Beat
  - Cron job: 0 * * * * cd /path && python manage.py process_pending_earnings
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from rider.models import RiderWallet
from rider.payout_service import PayoutService


class Command(BaseCommand):
    help = 'Move pending earnings to available balance after 24-hour dispute window'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Hours to wait before releasing pending earnings (default: 24)'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        
        self.stdout.write(
            self.style.WARNING(f'⏳ Processing pending earnings (hold period: {hours} hours)...')
        )
        
        try:
            result = PayoutService.move_pending_to_available(hours=hours)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ {result["wallets_updated"]} wallets processed\n'
                    f'   Message: {result["message"]}'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error processing pending earnings: {str(e)}')
            )
