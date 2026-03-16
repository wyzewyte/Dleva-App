"""
Management command to auto-reactivate suspended riders after 7 days.

Run daily via Celery, cron, or manually:
  python manage.py reactivate_suspended_riders
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from rider.models import RiderProfile
from rider.performance_service import PerformanceService


class Command(BaseCommand):
    help = 'Reactivate riders whose suspension period has expired (7 days)'
    
    def handle(self, *args, **options):
        self.stdout.write('Starting auto-reactivation of suspended riders...')
        
        result = PerformanceService.check_and_reactivate_suspended()
        
        if result['reactivated_count'] > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Reactivated {result['reactivated_count']} riders"
                )
            )
        else:
            self.stdout.write(self.style.WARNING('No riders to reactivate'))
        
        self.stdout.write(self.style.SUCCESS('Task completed'))
