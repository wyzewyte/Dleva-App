"""
Django Management Command: Process Rider Assignment Timeouts
Checks for orders in 'awaiting_rider' status that have exceeded their 
assignment_timeout_at and triggers re-assignment.

Usage:
  python manage.py process_assignment_timeouts

Schedule: Run every 30-60 seconds.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from buyer.models import Order
from rider.assignment_service import assign_order_to_riders
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process orders that have timed out during rider assignment'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Find orders that timed out
        timed_out_orders = Order.objects.filter(
            status='awaiting_rider',
            assignment_timeout_at__lte=now
        )
        
        if not timed_out_orders.exists():
            return

        self.stdout.write(self.style.WARNING(f"Found {timed_out_orders.count()} timed-out orders"))
        
        for order in timed_out_orders:
            try:
                self.stdout.write(f"Processing timeout for Order #{order.id}...")
                
                # Reset order status to allow re-assignment
                # assign_order_to_riders expects 'available_for_pickup' or 'awaiting_rider'
                # but we'll set it to 'available_for_pickup' to trigger a fresh search
                order.status = 'available_for_pickup'
                order.save()
                
                result = assign_order_to_riders(order)
                
                if result.get('success'):
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Re-assigned Order #{order.id} to {len(result.get('assigned_riders', []))} riders"))
                else:
                    self.stdout.write(self.style.ERROR(f"  ✗ Failed to re-assign Order #{order.id}: {result.get('reason')}"))
            
            except Exception as e:
                logger.error(f"Error processing assignment timeout for Order {order.id}: {str(e)}")
                self.stdout.write(self.style.ERROR(f"  ✗ Exception: {str(e)}"))
