"""
Phase 5: Payout and Withdrawal Endpoints
Handles rider withdrawal requests and payout approvals
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal
from rider.models import RiderProfile, PayoutRequest
from .payout_service import PayoutService, PayoutError


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    """
    Rider requests a withdrawal/payout.
    
    URL: POST /api/rider/payout/request/
    Auth: Rider (JWT)
    Body: { "amount": 5000 }
    
    Requirements:
    - Available balance >= amount
    - Minimum ₦2000
    - Wallet not frozen
    - Bank details registered
    - One withdrawal per 24 hours (cooldown)
    - No open disputes
    
    Response: 200 {payout_id, amount, bank_name, ...}
    Error: 400 (validation), 404 (not found)
    """
    try:
        rider_profile = get_object_or_404(RiderProfile, user__id=request.user.id)
        
        amount_str = request.data.get('amount')
        if not amount_str:
            return Response(
                {'error': 'amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount = Decimal(str(amount_str))
        
        result = PayoutService.request_payout(request.user.id, amount)
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except (ValueError, TypeError) as e:
        return Response(
            {'error': 'Invalid amount format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payout_history(request):
    """
    Get rider's payout/withdrawal history.
    
    URL: GET /api/rider/payout/history/
    Auth: Rider (JWT)
    Query params: ?status=completed (optional filter)
    
    Response: 200 [
        {
            id: 1,
            amount: "5000.00",
            status: "completed",
            bank_name: "GTBank",
            account_name: "John Doe",
            requested_at: "...",
            approved_at: "...",
            completed_at: "..."
        }
    ]
    """
    try:
        rider = get_object_or_404(RiderProfile, user__id=request.user.id)
        
        payouts = PayoutRequest.objects.filter(rider=rider).order_by('-requested_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            payouts = payouts.filter(status=status_filter)
        
        data = []
        for payout in payouts:
            data.append({
                'id': payout.id,
                'amount': str(payout.amount),
                'status': payout.status,
                'bank_name': payout.bank_name,
                'account_name': payout.account_name,
                'requested_at': payout.requested_at.isoformat(),
                'approved_at': payout.approved_at.isoformat() if payout.approved_at else None,
                'completed_at': payout.completed_at.isoformat() if payout.completed_at else None,
                'rejection_reason': payout.rejection_reason,
            })
        
        return Response({
            'status': 'success',
            'count': len(data),
            'payouts': data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ===== ADMIN ENDPOINTS =====

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_payout(request, payout_id):
    """
    Admin approves a pending payout request.
    
    URL: POST /api/admin/payout/<id>/approve/
    Auth: Admin only
    
    Response: 200 {success, payout_id, amount, ...)
    Error: 403 (not admin), 404 (payout not found)
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        result = PayoutService.approve_payout(payout_id, request.user)
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_complete_payout(request, payout_id):
    """
    Mark payout as completed (after bank transfer confirmed).
    
    URL: POST /api/admin/payout/<id>/complete/
    Auth: Admin only
    
    Response: 200 {success, ...}
    Error: 403, 404, 400
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        result = PayoutService.complete_payout(payout_id)
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_payout(request, payout_id):
    """
    Admin rejects a payout request.
    
    URL: POST /api/admin/payout/<id>/reject/
    Auth: Admin only
    Body: { "reason": "Invalid bank details" }
    
    Response: 200 {success, ...}
    Error: 403, 404, 400
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        reason = request.data.get('reason', '')
        result = PayoutService.reject_payout(payout_id, reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_freeze_wallet(request, rider_id):
    """
    Admin freezes a rider's wallet (fraud investigation, etc).
    
    URL: POST /api/admin/rider/<id>/freeze-wallet/
    Auth: Admin only
    Body: { "reason": "Under investigation for fraud" }
    
    Response: 200 {status, message, ...}
    Error: 403, 404
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        reason = request.data.get('reason', '')
        result = PayoutService.freeze_wallet(rider_id, request.user, reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_unfreeze_wallet(request, rider_id):
    """
    Admin unfreezes a rider's wallet.
    
    URL: POST /api/admin/rider/<id>/unfreeze-wallet/
    Auth: Admin only
    Body: { "reason": "Investigation cleared" } (optional)
    
    Response: 200
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        reason = request.data.get('reason', '')
        result = PayoutService.unfreeze_wallet(rider_id, request.user, reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_adjust_wallet(request, rider_id):
    """
    Admin manually adjusts rider's wallet (bonus/penalty/correction).
    
    URL: POST /api/admin/rider/<id>/adjust-wallet/
    Auth: Admin only
    Body: {
        "amount": 5000,
        "type": "bonus" | "penalty",
        "reason": "Great service bonus"
    }
    
    Response: 200 {new_balance, ...}
    Error: 403, 404, 400
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        amount = Decimal(str(request.data.get('amount')))
        adjustment_type = request.data.get('type')
        reason = request.data.get('reason', '')
        
        if not adjustment_type or adjustment_type not in ['bonus', 'penalty']:
            return Response(
                {'error': 'type must be "bonus" or "penalty"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = PayoutService.admin_adjust_wallet(
            rider_id, request.user, amount, adjustment_type, reason
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except PayoutError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except (ValueError, TypeError) as e:
        return Response(
            {'error': 'Invalid amount format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
