"""
Phase 5: Wallet and Earnings Endpoints
Handles wallet info, earnings history, and transaction records
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from rider.models import RiderProfile, RiderWallet, RiderTransaction


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet_info(request):
    """
    Get rider's wallet balance and status.
    
    URL: GET /api/rider/wallet/info/
    Auth: Rider (JWT)
    
    Response: 200 {
        available_balance: "10000.00",
        pending_balance: "500.00",
        total_earned: "50000.00",
        total_withdrawn: "40000.00",
        is_frozen: false,
        frozen_reason: null,
        last_withdrawal_date: "...",
        minimum_payout: "2000.00"
    }
    Error: 404 (wallet not found)
    """
    try:
        rider = get_object_or_404(RiderProfile, user__id=request.user.id)
        wallet = get_object_or_404(RiderWallet, rider=rider)
        
        return Response({
            'status': 'success',
            'wallet': {
                'available_balance': str(wallet.available_balance),
                'pending_balance': str(wallet.pending_balance),
                'total_balance': str(wallet.available_balance + wallet.pending_balance),
                'total_earned': str(wallet.total_earned),
                'total_withdrawn': str(wallet.total_withdrawn),
                'is_frozen': wallet.is_frozen,
                'frozen_reason': wallet.frozen_reason,
                'frozen_at': wallet.frozen_at.isoformat() if wallet.frozen_at else None,
                'last_withdrawal_date': wallet.last_withdrawal_date.isoformat() if wallet.last_withdrawal_date else None,
                'minimum_payout': '2000.00',
                'can_withdraw': not wallet.is_frozen and wallet.available_balance >= 2000,
                'withdrawal_cooldown_hours': 24,
                'pending_hold_hours': 24,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def earnings_today(request):
    """
    Get today's earnings breakdown.
    
    URL: GET /api/rider/wallet/earnings/today/
    Auth: Rider (JWT)
    
    Response: 200 {
        today_deliveries: 5,
        today_earnings: "2500.00",
        pending: "300.00",
        available: "2200.00"
    }
    """
    try:
        rider = get_object_or_404(RiderProfile, user__id=request.user.id)
        
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        
        transactions = RiderTransaction.objects.filter(
            rider=rider,
            transaction_type='delivery_earning',
            created_at__gte=today_start,
            status='completed'
        )
        
        total_today = sum(t.amount for t in transactions)
        count = transactions.count()
        
        return Response({
            'status': 'success',
            'earnings': {
                'date': today.isoformat(),
                'deliveries': count,
                'total_earned': str(total_today),
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def earnings_weekly(request):
    """
    Get weekly earnings breakdown (last 7 days).
    
    URL: GET /api/rider/wallet/earnings/weekly/
    Auth: Rider (JWT)
    
    Response: 200 {
        period: "2025-02-15 to 2025-02-22",
        deliveries: 42,
        total_earnings: "21000.00",
        daily_breakdown: [...]
    }
    """
    try:
        rider = get_object_or_404(RiderProfile, user__id=request.user.id)
        
        today = timezone.now().date()
        week_start = today - timedelta(days=6)
        
        transactions = RiderTransaction.objects.filter(
            rider=rider,
            transaction_type='delivery_earning',
            created_at__date__gte=week_start,
            status='completed'
        ).order_by('created_at')
        
        # Group by day
        daily = {}
        for t in transactions:
            day = t.created_at.date()
            if day not in daily:
                daily[day] = {'deliveries': 0, 'total': 0}
            daily[day]['deliveries'] += 1
            daily[day]['total'] += float(t.amount)
        
        # Format response
        daily_breakdown = [
            {
                'date': day.isoformat(),
                'deliveries': counts['deliveries'],
                'earnings': f"{counts['total']:.2f}"
            }
            for day, counts in sorted(daily.items())
        ]
        
        total_earnings = sum(t.amount for t in transactions)
        
        return Response({
            'status': 'success',
            'earnings': {
                'period': f"{week_start} to {today}",
                'total_deliveries': transactions.count(),
                'total_earnings': str(total_earnings),
                'daily_breakdown': daily_breakdown
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    """
    Get complete transaction history.
    
    URL: GET /api/rider/wallet/transactions/
    Auth: Rider (JWT)
    Query params: ?type=delivery_earning, ?limit=50, ?offset=0
    
    Response: 200 {
        count: 150,
        transactions: [
            {
                id: 1,
                order_id: 123,
                type: "delivery_earning",
                amount: "450.00",
                description: "Delivery Order #123",
                status: "completed",
                created_at: "..."
            }
        ]
    }
    """
    try:
        rider = get_object_or_404(RiderProfile, user__id=request.user.id)
        
        transactions = RiderTransaction.objects.filter(
            rider=rider
        ).order_by('-created_at')
        
        # Filter by type if provided
        type_filter = request.query_params.get('type')
        if type_filter:
            transactions = transactions.filter(transaction_type=type_filter)
        
        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        total_count = transactions.count()
        transactions = transactions[offset:offset+limit]
        
        data = []
        for t in transactions:
            data.append({
                'id': t.id,
                'order_id': t.order.id if t.order else None,
                'type': t.transaction_type,
                'amount': str(t.amount),
                'description': t.description,
                'status': t.status,
                'created_at': t.created_at.isoformat(),
            })
        
        return Response({
            'status': 'success',
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'count': len(data)
            },
            'transactions': data
        }, status=status.HTTP_200_OK)
        
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid limit or offset'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def earnings_summary(request):
    """
    Get comprehensive earnings summary and statistics.
    
    URL: GET /api/rider/wallet/summary/
    Auth: Rider (JWT)
    
    Response: 200 {
        total_earnings: "50000.00",
        total_deliveries: 100,
        average_per_delivery: "500.00",
        this_month_earnings: "5000.00",
        this_month_deliveries: 10,
        pending_earnings: "300.00"
    }
    """
    try:
        rider = get_object_or_404(RiderProfile, user__id=request.user.id)
        wallet = get_object_or_404(RiderWallet, rider=rider)
        
        # All-time stats
        all_transactions = RiderTransaction.objects.filter(
            rider=rider,
            transaction_type='delivery_earning',
            status='completed'
        )
        
        total_earnings = sum(t.amount for t in all_transactions)
        total_count = all_transactions.count()
        avg_per_delivery = total_earnings / total_count if total_count > 0 else 0
        
        # This month
        today = timezone.now()
        month_start = today.replace(day=1)
        
        month_transactions = RiderTransaction.objects.filter(
            rider=rider,
            transaction_type='delivery_earning',
            status='completed',
            created_at__gte=month_start
        )
        
        month_earnings = sum(t.amount for t in month_transactions)
        month_count = month_transactions.count()
        
        return Response({
            'status': 'success',
            'summary': {
                'total_earnings': str(total_earnings),
                'total_deliveries': total_count,
                'average_per_delivery': f"{avg_per_delivery:.2f}",
                'total_withdrawn': str(wallet.total_withdrawn),
                'current_available': str(wallet.available_balance),
                'current_pending': str(wallet.pending_balance),
                'this_month_earnings': str(month_earnings),
                'this_month_deliveries': month_count,
                'wallet_status': 'frozen' if wallet.is_frozen else 'active',
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
