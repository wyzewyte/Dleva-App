"""
Example: How to use the Email Notification System

This file demonstrates how to use the email notifications module
throughout your Django application.
"""

# ============================================================================
# BASIC USAGE EXAMPLES
# ============================================================================

# Example 1: Send a welcome email
# ============================================================================
from emails.notifications import send_welcome_email

# In your user registration view:
def register_user(request):
    user_email = request.POST.get('email')
    user_name = request.POST.get('name')
    
    # ... create user in database ...
    
    # Send welcome email
    send_welcome_email(
        recipient_email=user_email,
        user_name=user_name
    )


# Example 2: Send password reset email
# ============================================================================
from emails.notifications import send_password_reset_email

# In your password reset view:
def request_password_reset(request):
    email = request.POST.get('email')
    user = User.objects.get(email=email)
    
    # Generate reset token and URL
    reset_token = generate_reset_token(user)
    reset_url = f"https://yourdomain.com/reset-password/{reset_token}"
    
    # Send reset email
    send_password_reset_email(
        recipient_email=email,
        reset_url=reset_url,
        user_name=user.first_name
    )


# Example 3: Send order confirmation email
# ============================================================================
from emails.notifications import send_order_confirmation_email

# In your order creation view:
def create_order(request):
    order = Order.objects.create(...)
    
    send_order_confirmation_email(
        recipient_email=order.user.email,
        order_id=order.id,
        user_name=order.user.first_name,
        order_details={
            'total': order.total,
            'items': order.get_items_count(),
            'estimated_delivery': order.estimated_delivery
        }
    )


# Example 4: Send generic notification email
# ============================================================================
from emails.notifications import send_notification_email

# For any custom notification:
def notify_user_about_promotion(user, promo_details):
    html_message = f"""
    <h2>Special Promotion Available!</h2>
    <p>Hey {user.first_name},</p>
    <p>We have a special promotion just for you:</p>
    <p><strong>{promo_details['title']}</strong></p>
    <p>Discount: {promo_details['discount']}%</p>
    """
    
    send_notification_email(
        recipient_email=user.email,
        subject=f"Special Offer: {promo_details['title']}",
        message=html_message,
        user_name=user.first_name,
        tags=['promotion', 'marketing']
    )


# ============================================================================
# ENVIRONMENT VARIABLES REQUIRED
# ============================================================================
"""
Add these to your .env file:

BREVO_API_KEY=<your-brevo-api-key>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
"""


# ============================================================================
# TESTING EMAIL SENDING IN DEVELOPMENT
# ============================================================================
"""
To see emails in the console during development (instead of actually sending them),
uncomment this line in settings.py:

    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

Then run your Django development server and check the console output for emails.
"""


# ============================================================================
# ADDING NEW EMAIL TYPES
# ============================================================================
"""
To add a new email notification type:

1. Add a new function to emails/notifications.py
2. Follow the same pattern as existing functions
3. Use _send_email() as the base function

Example template:

def send_seller_payout_email(recipient_email, seller_name, payout_amount, payout_date):
    subject = f"Payout Confirmation - ${payout_amount}"
    
    html_content = f'''
    <html>
        <body>
            <h1>Payout Notification</h1>
            <p>Hi {seller_name},</p>
            <p>Your payout of ${payout_amount} has been processed.</p>
            <p>Expected arrival: {payout_date}</p>
            <p>Best regards,<br>The Dleva Team</p>
        </body>
    </html>
    '''
    
    text_content = f"Your payout of ${payout_amount} has been processed."
    
    return _send_email(
        subject=subject,
        recipient_email=recipient_email,
        html_content=html_content,
        text_content=text_content,
        tags=['payout', 'seller-notification']
    )
"""


# ============================================================================
# SCALABILITY & ASYNC PROCESSING (Future Enhancement)
# ============================================================================
"""
For high-volume email sending, integrate Celery for async processing:

1. Install Celery: pip install celery

2. Create emails/tasks.py:
    from celery import shared_task
    from .notifications import send_welcome_email as _send_welcome
    
    @shared_task
    def send_welcome_email_task(recipient_email, user_name):
        return _send_welcome(recipient_email, user_name)

3. Use in views:
    from emails.tasks import send_welcome_email_task
    send_welcome_email_task.delay(email, name)

This way, emails are queued and sent in the background without blocking requests.
"""
