"""
Phase 5: Dispute Endpoints
Handles order disputes from buyers, sellers, and riders
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from decimal import Decimal
from buyer.models import Order
from rider.models import Dispute
from .dispute_service import DisputeService, DisputeError


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lodge_dispute(request, order_id):
    """
    Lodge a dispute for an order.
    
    URL: POST /api/disputes/order/<id>/lodge/
    Auth: Buyer, Seller, or Rider (JWT)
    Body: {
        "user_type": "buyer|seller|rider",
        "reason": "quality_issue|delivery_delay|incomplete_order|wrong_order|rider_misconduct|seller_issue|other",
        "description": "Detailed explanation of the issue",
        "photo_url": "https://..." (optional)
    }
    
    Requirements:
    - Order must be delivered
    - Must be within 7 days of delivery
    - Only one open dispute per order
    
    Response: 200 {dispute_id, status, lodged_at, ...}
    Error: 400 (validation), 404 (order not found)
    """
    try:
        order = get_object_or_404(Order, id=order_id)
        
        user_type = request.data.get('user_type', '').lower()
        if not user_type or user_type not in ['buyer', 'seller', 'rider']:
            return Response(
                {'error': 'user_type must be buyer, seller, or rider'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason')
        if not reason:
            return Response(
                {'error': 'reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        description = request.data.get('description')
        if not description:
            return Response(
                {'error': 'description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        photo_url = request.data.get('photo_url', '')
        
        result = DisputeService.lodge_dispute(
            order_id,
            request.user.id,
            user_type,
            reason,
            description,
            photo_url
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except DisputeError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dispute_status(request, dispute_id):
    """
    Get dispute details and current status.
    
    URL: GET /api/disputes/<id>/status/
    Auth: Authenticated (buyer, seller, rider, or admin)
    
    Response: 200 {
        dispute_id, order_id, status, reason, lodged_by, 
        admin_decision, refund_amount, resolved_at, ...
    }
    Error: 404 (dispute not found)
    """
    try:
        dispute = get_object_or_404(Dispute, id=dispute_id)
        
        result = DisputeService.get_dispute_status(dispute_id)
        return Response(result, status=status.HTTP_200_OK)
        
    except DisputeError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_disputes(request):
    """
    Get all disputes lodged by current user.
    
    URL: GET /api/disputes/my-disputes/
    Auth: Authenticated (JWT)
    Query params: ?status=open (optional filter)
    
    Response: 200 { count, disputes: [...] }
    """
    try:
        disputes = Dispute.objects.filter(
            lodged_by=request.user
        ).order_by('-lodged_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            disputes = disputes.filter(status=status_filter)
        
        data = []
        for dispute in disputes:
            data.append({
                'dispute_id': dispute.id,
                'order_id': dispute.order.id,
                'status': dispute.status,
                'reason': dispute.reason,
                'lodged_at': dispute.lodged_at.isoformat(),
                'admin_decision': dispute.admin_decision,
                'refund_amount': str(dispute.refund_amount) if dispute.refund_amount else None,
                'resolved_at': dispute.resolved_at.isoformat() if dispute.resolved_at else None,
            })
        
        return Response({
            'status': 'success',
            'count': len(data),
            'disputes': data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ===== ADMIN ENDPOINTS =====

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_resolve_dispute_refund(request, dispute_id):
    """
    Admin resolves dispute by issuing refund.
    
    URL: POST /api/admin/disputes/<id>/resolve-refund/
    Auth: Admin only
    Body: {
        "refund_amount": 500,  (can be partial)
        "reason": "Quality issue confirmed"
    }
    
    Response: 200 {refund_amount, rider_penalty, ...}
    Error: 403 (not admin), 404 (dispute not found)
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        refund_amount = Decimal(str(request.data.get('refund_amount')))
        reason = request.data.get('reason', '')
        
        result = DisputeService.resolve_dispute_with_refund(
            dispute_id, request.user, refund_amount, reason
        )
        return Response(result, status=status.HTTP_200_OK)
        
    except DisputeError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except (ValueError, TypeError) as e:
        return Response(
            {'error': 'Invalid refund_amount format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_resolve_dispute_no_action(request, dispute_id):
    """
    Admin resolves dispute with no action (dismisses).
    
    URL: POST /api/admin/disputes/<id>/resolve-no-action/
    Auth: Admin only
    Body: { "reason": "Complaint not substantiated" }
    
    Response: 200
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        reason = request.data.get('reason', '')
        result = DisputeService.resolve_dispute_no_action(dispute_id, request.user, reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except DisputeError as e:
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
def admin_reject_dispute(request, dispute_id):
    """
    Admin rejects dispute (explicit rejection).
    
    URL: POST /api/admin/disputes/<id>/reject/
    Auth: Admin only
    Body: { "reason": "Invalid claim" }
    
    Response: 200
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        reason = request.data.get('reason', '')
        result = DisputeService.reject_dispute(dispute_id, request.user, reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except DisputeError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_disputes_list(request):
    """
    Admin view all disputes.
    
    URL: GET /api/admin/disputes/
    Auth: Admin only
    Query params: ?status=open, ?reason=quality_issue, etc
    
    Response: 200 { count, disputes: [...] }
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        disputes = Dispute.objects.all().order_by('-lodged_at')
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            disputes = disputes.filter(status=status_filter)
        
        # Filter by reason
        reason_filter = request.query_params.get('reason')
        if reason_filter:
            disputes = disputes.filter(reason=reason_filter)
        
        # Filter by decision
        decision_filter = request.query_params.get('decision')
        if decision_filter:
            disputes = disputes.filter(admin_decision=decision_filter)
        
        data = []
        for dispute in disputes:
            data.append({
                'dispute_id': dispute.id,
                'order_id': dispute.order.id,
                'lodged_by': dispute.lodged_by_type,
                'lodged_by_user': dispute.lodged_by.username if dispute.lodged_by else None,
                'reason': dispute.reason,
                'status': dispute.status,
                'admin_decision': dispute.admin_decision,
                'refund_amount': str(dispute.refund_amount) if dispute.refund_amount else None,
                'lodged_at': dispute.lodged_at.isoformat(),
                'resolved_at': dispute.resolved_at.isoformat() if dispute.resolved_at else None,
            })
        
        return Response({
            'status': 'success',
            'count': len(data),
            'disputes': data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
