"""
Phase 6: Performance Metrics and Suspension System
Handles rider rating calculations, performance metrics, and suspension logic
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q, Avg
from rider.models import RiderProfile, RiderRating, RiderOrder
from buyer.models import Order


class PerformanceError(Exception):
    """Raised when performance operation is invalid"""
    pass


class PerformanceService:
    """
    Manages rider performance tracking and suspension system.
    
    Metrics Tracked:
    - Average Rating (1-5 stars)
    - Acceptance Rate (accepted / assigned)
    - On-Time Delivery Rate (on-time / total)
    
    Suspension Rules:
    - If rating < 1.5 + 5+ ratings: Warning + 7-day improvement period
    - If still < 1.5 after 7 days: Auto-suspend
    - After 7 days suspended: Auto-reactivate
    - Admin can permanently deactivate
    """
    
    MINIMUM_RATINGS_FOR_WARNING = 5
    WARNING_THRESHOLD_RATING = Decimal('1.5')
    SUSPENSION_DURATION_DAYS = 7
    
    @staticmethod
    @transaction.atomic
    def submit_rating(order_id: int, rider_id: int, user_id: int, 
                      rating: int, comment: str = '') -> dict:
        """
        Buyer submits a rating for a rider after delivery.
        
        Requirements:
        - Order must be delivered
        - Buyer must be the one who created the order
        - Cannot have existing rating for this order
        - Rating must be 1-5
        
        Updates rider's average_rating automatically
        """
        # Validate rating
        if rating < 1 or rating > 5:
            raise PerformanceError("Rating must be between 1 and 5")
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            raise PerformanceError("Order not found")
        
        # Check order is delivered
        if order.status != 'delivered':
            raise PerformanceError(
                f"Can only rate delivered orders (current status: {order.status})"
            )
        
        # Check buyer is the one rating
        if order.buyer.user.id != user_id:
            raise PerformanceError("Only the buyer can rate this order")
        
        # Check rider matches
        if order.rider.id != rider_id:
            raise PerformanceError("Rider does not match this order")
        
        # Check no existing rating
        existing = RiderRating.objects.filter(
            order=order,
            rider_id=rider_id,
            rated_by='buyer'
        ).first()
        
        if existing:
            raise PerformanceError("Rating already submitted for this order")
        
        # Create rating
        rating_obj = RiderRating.objects.create(
            rider_id=rider_id,
            order=order,
            rating=rating,
            comment=comment,
            rated_by='buyer'
        )
        
        # Update rider's average rating
        PerformanceService._update_average_rating(rider_id)
        
        # Check if warning/suspension needed
        PerformanceService._check_and_apply_warning_suspension(rider_id)
        
        return {
            'status': 'success',
            'message': 'Rating submitted',
            'rating_id': rating_obj.id,
            'order_id': order.id,
            'rider_id': rider_id,
            'rating': rating,
            'new_average_rating': str(PerformanceService._get_average_rating(rider_id)),
        }
    
    @staticmethod
    def _update_average_rating(rider_id: int) -> Decimal:
        """Calculate and update rider's average rating (rider_id is RiderProfile.id)"""
        try:
            rider = RiderProfile.objects.get(id=rider_id)  # ✅ Use RiderProfile ID directly
        except RiderProfile.DoesNotExist:
            raise PerformanceError(f"Rider not found (id={rider_id})")
        
        # Get all ratings for this rider
        ratings = RiderRating.objects.filter(rider=rider, rated_by='buyer').values_list('rating', flat=True)
        
        if ratings.count() == 0:
            rider.average_rating = Decimal('0.00')
        else:
            avg = sum(ratings) / len(ratings)
            rider.average_rating = Decimal(str(round(float(avg), 2)))
        
        rider.save()
        return rider.average_rating
    
    @staticmethod
    def _get_average_rating(rider_id: int) -> Decimal:
        """Get current average rating (rider_id is RiderProfile.id)"""
        try:
            rider = RiderProfile.objects.get(id=rider_id)
            return rider.average_rating
        except:
            return Decimal('0.00')
    
    @staticmethod
    def _get_rating_count(rider_id: int) -> int:
        """Count total ratings for rider (rider_id is RiderProfile.id)"""
        try:
            rider = RiderProfile.objects.get(id=rider_id)
            return RiderRating.objects.filter(rider=rider, rated_by='buyer').count()
        except:
            return 0
    
    @staticmethod
    def _check_and_apply_warning_suspension(rider_id: int):
        """
        Check if rider should be warned or suspended based on rating.
        
        Rules:
        - If rating < 1.5 AND 5+ ratings AND no warning yet: Issue warning
        - If rating < 1.5 AND 5+ ratings AND warning expired (7 days): Suspend
        """
        try:
            rider = RiderProfile.objects.select_for_update().get(id=rider_id)
        except RiderProfile.DoesNotExist:
            return
        
        avg_rating = rider.average_rating
        rating_count = PerformanceService._get_rating_count(rider_id)
        
        # Check if should warn
        if (avg_rating < PerformanceService.WARNING_THRESHOLD_RATING and 
            rating_count >= PerformanceService.MINIMUM_RATINGS_FOR_WARNING):
            
            # Check if already suspended or deactivated
            if rider.account_status in ['suspended', 'deactivated']:
                return
            
            # If no warning issued yet, issue one
            if not rider.warning_issued_at:
                rider.warning_issued_at = timezone.now()
                rider.save()
                
                # TODO: Send notification to rider
                return {
                    'action': 'warning_issued',
                    'message': f'Your rating ({avg_rating}) is below 1.5. You have 7 days to improve.',
                }
            
            # If warning was issued 7+ days ago, suspend
            days_since_warning = (timezone.now() - rider.warning_issued_at).days
            if days_since_warning >= PerformanceService.SUSPENSION_DURATION_DAYS:
                rider.account_status = 'suspended'
                rider.suspension_start_date = timezone.now()
                rider.suspension_reason = f"Low rating ({avg_rating}) - 7 day improvement period failed"
                rider.is_online = False  # Force offline
                rider.save()
                
                # TODO: Send suspension notification
                return {
                    'action': 'suspended',
                    'message': f'Account suspended due to low rating. Will auto-reactivate in 7 days.',
                }
    
    @staticmethod
    def update_acceptance_rate(rider_id: int) -> Decimal:
        """
        Update rider's acceptance rate.
        
        Formula: Accepted orders / Assigned orders
        """
        try:
            rider = RiderProfile.objects.select_for_update().get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PerformanceError("Rider not found")
        
        # Count assigned orders
        assigned = RiderOrder.objects.filter(rider=rider).count()
        if assigned == 0:
            rider.acceptance_rate = Decimal('0.00')
            rider.save()
            return Decimal('0.00')
        
        # Count accepted orders
        accepted = RiderOrder.objects.filter(
            rider=rider,
            status__in=['accepted', 'completed']
        ).count()
        
        # Calculate percentage
        rate = (Decimal(accepted) / Decimal(assigned)) * 100
        rider.acceptance_rate = rate.quantize(Decimal('0.01'))
        rider.save()
        
        return rider.acceptance_rate
    
    @staticmethod
    def update_on_time_rate(rider_id: int) -> Decimal:
        """
        Update rider's on-time delivery rate.
        
        Formula: On-time deliveries / Total deliveries
        
        On-time = delivered_at <= expected_delivery_time (if set)
        """
        try:
            rider = RiderProfile.objects.select_for_update().get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PerformanceError("Rider not found")
        
        # Get all delivered orders by this rider
        delivered = Order.objects.filter(
            rider=rider,
            status='delivered',
            delivered_at__isnull=False
        )
        
        total = delivered.count()
        if total == 0:
            rider.on_time_rate = Decimal('0.00')
            rider.save()
            return Decimal('0.00')
        
        # Count on-time deliveries
        on_time = 0
        for order in delivered:
            # If no expected time, count as on-time
            if not order.expected_delivery_time:
                on_time += 1
            elif order.delivered_at <= order.expected_delivery_time:
                on_time += 1
        
        # Calculate percentage
        rate = (Decimal(on_time) / Decimal(total)) * 100
        rider.on_time_rate = rate.quantize(Decimal('0.01'))
        rider.save()
        
        return rider.on_time_rate
    
    @staticmethod
    def check_and_reactivate_suspended() -> dict:
        """
        Scheduled task: Check if suspended riders should be reactivated.
        Run daily via management command or Celery.
        """
        suspended = RiderProfile.objects.filter(
            account_status='suspended',
            suspension_start_date__isnull=False
        )
        
        reactivated_count = 0
        for rider in suspended:
            days_suspended = (timezone.now() - rider.suspension_start_date).days
            
            if days_suspended >= PerformanceService.SUSPENSION_DURATION_DAYS:
                # Reset suspension data
                rider.account_status = 'approved'
                rider.suspension_start_date = None
                rider.warning_issued_at = None
                rider.suspension_reason = None
                rider.save()
                
                reactivated_count += 1
                
                # TODO: Send reactivation notification
        
        return {
            'status': 'success',
            'message': f'Reactivated {reactivated_count} riders',
            'reactivated_count': reactivated_count,
        }
    
    @staticmethod
    @transaction.atomic
    def admin_deactivate_rider(rider_id: int, admin_user, reason: str = '') -> dict:
        """
        Admin permanently deactivates a rider.
        Used for fraud, theft, misconduct, etc.
        
        Rider cannot login or work until admin manually restores.
        """
        try:
            rider = RiderProfile.objects.select_for_update().get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PerformanceError("Rider not found")
        
        if rider.account_status == 'deactivated':
            raise PerformanceError("Rider already deactivated")
        
        rider.account_status = 'deactivated'
        rider.is_online = False
        rider.suspension_reason = f"Deactivated by admin: {reason}"
        rider.save()
        
        # Disable user login
        rider.user.is_active = False
        rider.user.save()
        
        # TODO: Send deactivation notification
        
        return {
            'status': 'success',
            'message': 'Rider permanently deactivated',
            'rider_id': rider.id,
            'reason': reason,
        }
    
    @staticmethod
    @transaction.atomic
    def admin_reactivate_rider(rider_id: int, admin_user) -> dict:
        """
        Admin manually reactivates a deactivated rider.
        """
        try:
            rider = RiderProfile.objects.select_for_update().get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PerformanceError("Rider not found")
        
        if rider.account_status != 'deactivated':
            raise PerformanceError(f"Can only reactivate deactivated riders (current: {rider.account_status})")
        
        rider.account_status = 'approved'
        rider.suspension_reason = None
        rider.save()
        
        # Re-enable user login
        rider.user.is_active = True
        rider.user.save()
        
        # TODO: Send reactivation notification
        
        return {
            'status': 'success',
            'message': 'Rider reactivated',
            'rider_id': rider.id,
        }
    
    @staticmethod
    def get_rider_performance(rider_id: int) -> dict:
        """Get complete performance stats for a rider"""
        try:
            # Try by RiderProfile.id first (common case), then by user__id
            try:
                rider = RiderProfile.objects.get(id=rider_id)
            except RiderProfile.DoesNotExist:
                rider = RiderProfile.objects.get(user__id=rider_id)
        except RiderProfile.DoesNotExist:
            raise PerformanceError("Rider not found")
        
        rating_count = PerformanceService._get_rating_count(rider_id)
        
        # Get recent ratings
        ratings = RiderRating.objects.filter(
            rider=rider,
            rated_by='buyer'
        ).order_by('-created_at')[:5]
        
        recent_ratings = [
            {
                'order_id': r.order.id,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at.isoformat()
            }
            for r in ratings
        ]
        
        return {
            'rider_id': rider.id,
            'full_name': rider.full_name,
            'average_rating': str(rider.average_rating),
            'total_ratings': rating_count,
            'acceptance_rate': str(rider.acceptance_rate),
            'on_time_rate': str(rider.on_time_rate),
            'total_deliveries': rider.total_deliveries,
            'account_status': rider.account_status,
            'is_online': rider.is_online,
            'warning_issued_at': rider.warning_issued_at.isoformat() if rider.warning_issued_at else None,
            'suspension_start_date': rider.suspension_start_date.isoformat() if rider.suspension_start_date else None,
            'suspension_reason': rider.suspension_reason,
            'recent_ratings': recent_ratings,
        }
    
    @staticmethod
    def get_all_riders_performance() -> list:
        """Get performance stats for all riders (admin view)"""
        riders = RiderProfile.objects.filter(
            account_status__in=['approved', 'suspended', 'deactivated']
        ).order_by('-average_rating')
        
        data = []
        for rider in riders:
            rating_count = PerformanceService._get_rating_count(rider.user.id)
            
            data.append({
                'rider_id': rider.id,
                'full_name': rider.full_name,
                'phone': rider.phone_number,
                'average_rating': str(rider.average_rating),
                'total_ratings': rating_count,
                'acceptance_rate': str(rider.acceptance_rate),
                'on_time_rate': str(rider.on_time_rate),
                'total_deliveries': rider.total_deliveries,
                'account_status': rider.account_status,
                'is_online': rider.is_online,
                'warning_issued': bool(rider.warning_issued_at),
                'suspended': rider.account_status == 'suspended',
                'deactivated': rider.account_status == 'deactivated',
            })
        
        return data
