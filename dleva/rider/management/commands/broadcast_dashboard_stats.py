"""
Management command to update admin dashboard statistics in real-time
Runs periodically to broadcast current delivery stats to admin dashboard
"""

from django.core.management.base import BaseCommand
from rider.realtime_service import RealtimeService
import time


class Command(BaseCommand):
    help = 'Broadcast real-time dashboard statistics to admin'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--loop',
            action='store_true',
            help='Continuously update stats every 5 seconds',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=5,
            help='Interval in seconds between updates (default: 5)',
        )
    
    def handle(self, *args, **options):
        loop = options.get('loop', False)
        interval = options.get('interval', 5)
        
        if loop:
            self.stdout.write('Starting continuous dashboard updates...')
            try:
                while True:
                    RealtimeService.update_admin_dashboard()
                    time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING('Stopped.'))
        else:
            RealtimeService.update_admin_dashboard()
            self.stdout.write(self.style.SUCCESS('Dashboard updated'))
