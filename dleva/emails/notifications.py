"""
Email notification services using Brevo (Sendinblue) via django-anymail.

This module provides a comprehensive, DRY email notification system for Dleva:
- BUYER: 6 notification types
- SELLER: 5 notification types
- RIDER: 4 notification types

Each notification uses Django templates for HTML/text rendering.

Usage:
    from emails.notifications import send_buyer_order_confirmed_email
    send_buyer_order_confirmed_email(order)
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def _send_templated_email(
    subject,
    recipient_email,
    html_template,
    txt_template,
    context,
    recipient_name=None,
    tags=None,
    **kwargs
):
    """
    Base function to send templated emails. Handles rendering and sending.
    
    This function eliminates code duplication by centralizing:
    - Template rendering (HTML + text)
    - Email creation and sending
    - Error handling and logging
    - Brevo tagging

    Args:
        subject (str): Email subject line
        recipient_email (str): Recipient's email address
        html_template (str): Path to HTML template (e.g., 'emails/buyer/order_confirmed.html')
        txt_template (str): Path to text template (e.g., 'emails/buyer/order_confirmed.txt')
        context (dict): Context dictionary for template rendering
        recipient_name (str, optional): Recipient's display name
        tags (list, optional): Brevo tags for categorization
        **kwargs: Additional parameters for EmailMultiAlternatives

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Render HTML and text templates
        html_content = render_to_string(html_template, context)
        text_content = render_to_string(txt_template, context)

        # Format recipient with name if provided
        if recipient_name:
            recipient_address = f"{recipient_name} <{recipient_email}>"
        else:
            recipient_address = recipient_email

        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=None,  # Uses DEFAULT_FROM_EMAIL from settings
            to=[recipient_address],
            **kwargs
        )

        # Attach HTML alternative
        email.attach_alternative(html_content, "text/html")

        # Add Brevo metadata tags if provided
        if tags:
            email.tags = tags

        # Send email
        email.send()
        # Safely log without unicode issues
        safe_subject = subject.encode('ascii', 'replace').decode('ascii')
        logger.info(
            f"Email sent successfully to {recipient_email} | Subject: {safe_subject} | Tags: {tags}"
        )
        return True

    except Exception as e:
        # Safely log without unicode issues
        safe_subject = subject.encode('ascii', 'replace').decode('ascii')
        logger.error(
            f"Failed to send email to {recipient_email} | Subject: {safe_subject} | "
            f"Error: {str(e)}"
        )
        return False


# ============================================================================
# BUYER NOTIFICATIONS (6 functions)
# ============================================================================


def send_buyer_otp_verification_email(user_email, user_name, otp):
    """
    Send OTP verification email to buyer on signup/login.

    Args:
        user_email (str): Buyer's email address
        user_name (str): Buyer's name
        otp (str): One-time password code

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'user_name': user_name,
        'otp': otp,
    }

    return _send_templated_email(
        subject=f"Verify Your Email - OTP: {otp}",
        recipient_email=user_email,
        html_template='emails/buyer/otp_verification.html',
        txt_template='emails/buyer/otp_verification.txt',
        context=context,
        recipient_name=user_name,
        tags=['otp-verification', 'buyer', 'auth'],
    )


def send_buyer_order_confirmed_email(order):
    """
    Send order confirmation email to buyer.

    Args:
        order (Order): Order instance

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'buyer_name': order.buyer.user.first_name or order.buyer.user.username,
        'order_id': order.id,
        'restaurant_name': order.restaurant.name,
        'subtotal': order.total_price - order.delivery_fee,
        'delivery_fee': order.delivery_fee,
        'total_price': order.total_price,
        'estimated_delivery_time': '30-45 minutes',  # Can be customized
    }

    return _send_templated_email(
        subject=f"Order #{order.id} Confirmed - {order.restaurant.name}",
        recipient_email=order.buyer.user.email,
        html_template='emails/buyer/order_confirmed.html',
        txt_template='emails/buyer/order_confirmed.txt',
        context=context,
        recipient_name=context['buyer_name'],
        tags=['order-confirmed', 'buyer', 'order'],
    )


def send_buyer_order_out_for_delivery_email(order):
    """
    Send email to buyer when order is out for delivery.

    Args:
        order (Order): Order instance with assigned rider

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'buyer_name': order.buyer.user.first_name or order.buyer.user.username,
        'order_id': order.id,
        'restaurant_name': order.restaurant.name,
        'rider_name': order.rider.full_name,
        'rider_phone': order.rider.phone_number,
        'rider_vehicle_type': order.rider.get_vehicle_type_display(),
        'delivery_address': order.delivery_address,
    }

    return _send_templated_email(
        subject=f"Order #{order.id} On the Way! 🚴",
        recipient_email=order.buyer.user.email,
        html_template='emails/buyer/order_out_for_delivery.html',
        txt_template='emails/buyer/order_out_for_delivery.txt',
        context=context,
        recipient_name=context['buyer_name'],
        tags=['order-on-way', 'buyer', 'delivery'],
    )


def send_buyer_order_delivered_email(order):
    """
    Send email to buyer when order is delivered.

    Args:
        order (Order): Delivered order instance

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'buyer_name': order.buyer.user.first_name or order.buyer.user.username,
        'order_id': order.id,
        'restaurant_name': order.restaurant.name,
        'rider_name': order.rider.full_name,
        'total_price': order.total_price,
    }

    return _send_templated_email(
        subject=f"Order #{order.id} Delivered! 🎉",
        recipient_email=order.buyer.user.email,
        html_template='emails/buyer/order_delivered.html',
        txt_template='emails/buyer/order_delivered.txt',
        context=context,
        recipient_name=context['buyer_name'],
        tags=['order-delivered', 'buyer', 'delivery'],
    )


def send_buyer_order_cancelled_email(order, cancellation_reason, refund_amount, refund_status='pending'):
    """
    Send order cancellation and refund notice to buyer.

    Args:
        order (Order): Cancelled order instance
        cancellation_reason (str): Reason for cancellation
        refund_amount (Decimal): Refund amount
        refund_status (str): Status of refund (default: 'pending')

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'buyer_name': order.buyer.user.first_name or order.buyer.user.username,
        'order_id': order.id,
        'restaurant_name': order.restaurant.name,
        'total_price': order.total_price,
        'refund_amount': refund_amount,
        'refund_status': refund_status,
        'cancellation_reason': cancellation_reason,
    }

    return _send_templated_email(
        subject=f"Order #{order.id} Cancelled - Refund Initiated",
        recipient_email=order.buyer.user.email,
        html_template='emails/buyer/order_cancelled.html',
        txt_template='emails/buyer/order_cancelled.txt',
        context=context,
        recipient_name=context['buyer_name'],
        tags=['order-cancelled', 'buyer', 'refund'],
    )


def send_buyer_password_reset_otp_email(user_email, user_name, otp):
    """
    Send password reset OTP email to buyer.

    Args:
        user_email (str): Buyer's email address
        user_name (str): Buyer's name
        otp (str): One-time password code

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'user_name': user_name,
        'otp': otp,
    }

    return _send_templated_email(
        subject=f"Password Reset OTP: {otp}",
        recipient_email=user_email,
        html_template='emails/buyer/password_reset_otp.html',
        txt_template='emails/buyer/password_reset_otp.txt',
        context=context,
        recipient_name=user_name,
        tags=['password-reset', 'buyer', 'security'],
    )


# ============================================================================
# SELLER NOTIFICATIONS (5 functions)
# ============================================================================


def send_seller_otp_verification_email(user_email, seller_name, otp):
    """
    Send OTP verification email to seller on signup/login.

    Args:
        user_email (str): Seller's email address
        seller_name (str): Seller/restaurant name
        otp (str): One-time password code

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'seller_name': seller_name,
        'otp': otp,
    }

    return _send_templated_email(
        subject=f"Verify Your Email - OTP: {otp}",
        recipient_email=user_email,
        html_template='emails/seller/otp_verification.html',
        txt_template='emails/seller/otp_verification.txt',
        context=context,
        recipient_name=seller_name,
        tags=['otp-verification', 'seller', 'auth'],
    )


def send_seller_new_order_received_email(order):
    """
    Send new order notification to seller.

    Args:
        order (Order): New order instance

    Returns:
        bool: True if successful, False otherwise
    """
    # Get order items
    order_items = []
    for cart_item in order.buyer.carts.filter(restaurant=order.restaurant).first().items.all():
        order_items.append({
            'name': cart_item.menu_item.name,
            'quantity': cart_item.quantity,
        })

    context = {
        'seller_name': order.restaurant.seller.restaurant_name or order.restaurant.name,
        'order_id': order.id,
        'buyer_name': order.buyer.user.first_name or order.buyer.user.username,
        'total_price': order.total_price,
        'delivery_fee': order.delivery_fee,
        'item_count': sum(item['quantity'] for item in order_items),
        'order_items': order_items,
        'order_time': order.created_at.strftime('%I:%M %p'),
        'delivery_address': order.delivery_address,
    }

    return _send_templated_email(
        subject=f"🎉 New Order #{order.id} - {order.buyer.user.first_name or 'Customer'}",
        recipient_email=order.restaurant.seller.user.email,
        html_template='emails/seller/new_order_received.html',
        txt_template='emails/seller/new_order_received.txt',
        context=context,
        recipient_name=context['seller_name'],
        tags=['new-order', 'seller', 'order'],
    )


def send_seller_order_picked_up_email(order):
    """
    Send notification to seller when rider picks up order.

    Args:
        order (Order): Order that was picked up

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'seller_name': order.restaurant.seller.restaurant_name or order.restaurant.name,
        'order_id': order.id,
        'buyer_name': order.buyer.user.first_name or order.buyer.user.username,
        'rider_name': order.rider.full_name,
        'rider_phone': order.rider.phone_number,
        'pickup_time': order.picked_up_at.strftime('%I:%M %p') if order.picked_up_at else 'Just now',
    }

    return _send_templated_email(
        subject=f"Order #{order.id} Picked Up by Rider 🚴",
        recipient_email=order.restaurant.seller.user.email,
        html_template='emails/seller/order_picked_up.html',
        txt_template='emails/seller/order_picked_up.txt',
        context=context,
        recipient_name=context['seller_name'],
        tags=['order-picked-up', 'seller', 'delivery'],
    )


def send_seller_payout_processed_email(payout):
    """
    Send payout confirmation email to seller.

    Args:
        payout (Payout): Payout instance

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'seller_name': payout.seller.restaurant_name or payout.seller.user.first_name or payout.seller.user.username,
        'payout_id': payout.id,
        'amount': payout.amount,
        'status': payout.get_status_display(),
        'bank_name': payout.bank_name or 'N/A',
        'account_number': payout.account_number or 'N/A',
        'processed_date': payout.updated_at.strftime('%d-%m-%Y'),
    }

    return _send_templated_email(
        subject=f"💰 Payout #{payout.id} Processed - ₦{payout.amount}",
        recipient_email=payout.seller.user.email,
        html_template='emails/seller/payout_processed.html',
        txt_template='emails/seller/payout_processed.txt',
        context=context,
        recipient_name=context['seller_name'],
        tags=['payout-processed', 'seller', 'payment'],
    )


def send_seller_password_reset_otp_email(user_email, seller_name, otp):
    """
    Send password reset OTP email to seller.

    Args:
        user_email (str): Seller's email address
        seller_name (str): Seller/restaurant name
        otp (str): One-time password code

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'seller_name': seller_name,
        'otp': otp,
    }

    return _send_templated_email(
        subject=f"Password Reset OTP: {otp}",
        recipient_email=user_email,
        html_template='emails/seller/password_reset_otp.html',
        txt_template='emails/seller/password_reset_otp.txt',
        context=context,
        recipient_name=seller_name,
        tags=['password-reset', 'seller', 'security'],
    )


# ============================================================================
# RIDER NOTIFICATIONS (4 functions)
# ============================================================================


def send_rider_otp_verification_email(user_email, rider_name, otp):
    """
    Send OTP verification email to rider on signup/login.

    Args:
        user_email (str): Rider's email address
        rider_name (str): Rider's full name
        otp (str): One-time password code

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'rider_name': rider_name,
        'otp': otp,
    }

    return _send_templated_email(
        subject=f"Verify Your Email - OTP: {otp}",
        recipient_email=user_email,
        html_template='emails/rider/otp_verification.html',
        txt_template='emails/rider/otp_verification.txt',
        context=context,
        recipient_name=rider_name,
        tags=['otp-verification', 'rider', 'auth'],
    )


def send_rider_new_delivery_assigned_email(order):
    """
    Send new delivery assignment notification to rider.

    Args:
        order (Order): Order assigned to rider

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'rider_name': order.rider.full_name,
        'order_id': order.id,
        'restaurant_name': order.restaurant.name,
        'pickup_address': order.restaurant.address,
        'delivery_address': order.delivery_address,
        'distance_km': order.distance_km or 0,
        'rider_earning': order.rider_earning or 0,
        'assigned_time': order.assigned_at.strftime('%I:%M %p') if order.assigned_at else 'Now',
    }

    return _send_templated_email(
        subject=f"🎉 New Delivery Assigned - Order #{order.id}",
        recipient_email=order.rider.user.email,
        html_template='emails/rider/new_delivery_assigned.html',
        txt_template='emails/rider/new_delivery_assigned.txt',
        context=context,
        recipient_name=context['rider_name'],
        tags=['delivery-assigned', 'rider', 'delivery'],
    )


def send_rider_delivery_completed_email(order):
    """
    Send delivery completion confirmation to rider.

    Args:
        order (Order): Completed order instance

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'rider_name': order.rider.full_name,
        'order_id': order.id,
        'customer_name': order.buyer.user.first_name or order.buyer.user.username,
        'delivery_address': order.delivery_address,
        'rider_earning': order.rider_earning or 0,
        'delivery_time': order.delivered_at.strftime('%I:%M %p') if order.delivered_at else 'Just now',
    }

    return _send_templated_email(
        subject=f"✅ Delivery Completed - Order #{order.id}",
        recipient_email=order.rider.user.email,
        html_template='emails/rider/delivery_completed.html',
        txt_template='emails/rider/delivery_completed.txt',
        context=context,
        recipient_name=context['rider_name'],
        tags=['delivery-completed', 'rider', 'delivery'],
    )


def send_rider_password_reset_otp_email(user_email, rider_name, otp):
    """
    Send password reset OTP email to rider.

    Args:
        user_email (str): Rider's email address
        rider_name (str): Rider's full name
        otp (str): One-time password code

    Returns:
        bool: True if successful, False otherwise
    """
    context = {
        'rider_name': rider_name,
        'otp': otp,
    }

    return _send_templated_email(
        subject=f"Password Reset OTP: {otp}",
        recipient_email=user_email,
        html_template='emails/rider/password_reset_otp.html',
        txt_template='emails/rider/password_reset_otp.txt',
        context=context,
        recipient_name=rider_name,
        tags=['password-reset', 'rider', 'security'],
    )

