# Email Notifications Module

## Overview

The `emails` app provides a centralized, scalable way to send all email notifications across the Dleva application using **Brevo (Sendinblue)** via **django-anymail**.

This design ensures:
- ✅ **Clean separation of concerns** - All email logic in one place
- ✅ **Easy to maintain** - Add new email types without touching core logic
- ✅ **Scalable** - Ready for Celery async processing
- ✅ **HTML & Plain Text** - Support for rich emails with fallback
- ✅ **Tagging & Tracking** - Brevo integration for analytics
- ✅ **Logging** - All email activity is logged for debugging

---

## Architecture

```
emails/
├── __init__.py          # Package initialization
├── apps.py              # Django app config
├── admin.py             # Admin interface (if needed)
├── models.py            # Database models (for future enhancement)
├── notifications.py     # ⭐ Core: All email sending functions
├── examples.py          # Usage examples & patterns
├── tests.py             # Unit tests
├── urls.py              # URL routing (if needed)
├── views.py             # Views (if needed)
└── README.md            # This file
```

---

## Setup & Configuration

### 1. Environment Variables

Add these to your `.env` file:

```bash
BREVO_API_KEY=your_api_key_here
DEFAULT_FROM_EMAIL=noreply@dleva.com
DEBUG=True  # or False for production
```

### 2. Settings Configuration

The following are already configured in `core/settings.py`:

```python
# Email Backend
EMAIL_BACKEND = 'anymail.backends.brevo.EmailBackend'

# Brevo Settings
ANYMAIL = {
    'BREVO_API_KEY': config('BREVO_API_KEY'),
    'TRACK_OPENS': True,
    'TRACK_CLICKS': True,
}

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')
```

### 3. Get Your Brevo API Key

1. Go to [Brevo.com](https://www.brevo.com)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Create a new API key
5. Copy it and add to your `.env` file

---

## Usage

### Basic Email Sending

```python
from emails.notifications import send_welcome_email

send_welcome_email(
    recipient_email='user@example.com',
    user_name='John Doe'
)
```

### Available Email Functions

#### 1. Welcome Email
```python
send_welcome_email(
    recipient_email='user@example.com',
    user_name='John Doe',
    recipient_name='John'  # Optional: For personalized greeting
)
```

#### 2. Password Reset Email
```python
send_password_reset_email(
    recipient_email='user@example.com',
    reset_url='https://yourdomain.com/reset-token-xyz',
    user_name='John Doe'
)
```

#### 3. Order Confirmation Email
```python
send_order_confirmation_email(
    recipient_email='user@example.com',
    order_id='ORD-12345',
    user_name='John Doe',
    order_details={
        'total': '$50.00',
        'items': 3,
        'estimated_delivery': '2025-05-10'
    }
)
```

#### 4. Generic Notification Email
```python
send_notification_email(
    recipient_email='user@example.com',
    subject='Important Update',
    message='<h1>Hello!</h1><p>Here is your message...</p>',
    tags=['notification', 'marketing']
)
```

---

## Adding New Email Types

Follow this pattern to add new email notification types:

```python
def send_my_new_email_type(
    recipient_email,
    recipient_name=None,
    **kwargs
):
    """
    Send [description] email.
    
    Args:
        recipient_email (str): Recipient's email address
        recipient_name (str, optional): Display name
        
    Returns:
        bool: True if successful, False otherwise
    """
    subject = "Your Email Subject"
    
    html_content = f"""
    <html>
        <body>
            <h1>Title</h1>
            <p>Content here...</p>
        </body>
    </html>
    """
    
    text_content = "Plain text version"
    
    return _send_email(
        subject=subject,
        recipient_email=recipient_email,
        html_content=html_content,
        text_content=text_content,
        recipient_name=recipient_name,
        tags=['my-email-type']  # For Brevo categorization
    )
```

### Best Practices for New Emails

1. ✅ Always provide both HTML and plain text versions
2. ✅ Add descriptive docstrings with clear parameters
3. ✅ Use meaningful tags for Brevo tracking
4. ✅ Log any custom business logic before sending
5. ✅ Return boolean success status for error handling

---

## Development vs Production

### Development: Console Output

To see emails in the console instead of sending them:

Uncomment this in `core/settings.py`:
```python
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

Then run `python manage.py runserver` and check the console for emails.

### Production: Brevo Sending

With `DEBUG=False`, emails will be sent through Brevo:

```python
EMAIL_BACKEND = 'anymail.backends.brevo.EmailBackend'
```

Ensure `BREVO_API_KEY` is set in production environment variables.

---

## Async Email Sending (Future Enhancement)

For high-volume sending, use Celery:

### 1. Install Celery
```bash
pip install celery
```

### 2. Create `emails/tasks.py`
```python
from celery import shared_task
from .notifications import (
    send_welcome_email as _send_welcome,
    send_order_confirmation_email as _send_order,
)

@shared_task
def send_welcome_email_task(recipient_email, user_name):
    return _send_welcome(recipient_email, user_name)

@shared_task
def send_order_confirmation_task(recipient_email, order_id, user_name, order_details):
    return _send_order(recipient_email, order_id, user_name, order_details)
```

### 3. Use in Views
```python
from emails.tasks import send_welcome_email_task

# Send email asynchronously (non-blocking)
send_welcome_email_task.delay('user@example.com', 'John Doe')
```

---

## Testing

### Unit Tests

```python
# In emails/tests.py
from django.test import TestCase
from django.core import mail
from .notifications import send_welcome_email

class EmailTestCase(TestCase):
    def test_welcome_email(self):
        send_welcome_email('test@example.com', 'Test User')
        
        # Check that an email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Welcome to Dleva, Test User!')
        self.assertIn('test@example.com', mail.outbox[0].to)
```

### Run Tests
```bash
python manage.py test emails
```

---

## Troubleshooting

### Issue: "BREVO_API_KEY is None"

**Solution:** Ensure `BREVO_API_KEY` is set in your `.env` file

```bash
BREVO_API_KEY=your_actual_api_key
```

### Issue: Emails not being sent

**Check:**
1. `EMAIL_BACKEND` is correctly set
2. `BREVO_API_KEY` is valid
3. Check Django logs for error messages
4. In development, check if `console.EmailBackend` is being used instead

### Issue: "Module not found" for emails

**Solution:** Ensure `'emails'` is in `INSTALLED_APPS` in settings.py

---

## Performance Considerations

1. **Batch Sending:** Use `send_email_batch()` for newsletters
2. **Async Processing:** Implement Celery for non-blocking sends
3. **Rate Limiting:** Brevo has rate limits; spread large sends over time
4. **Template Rendering:** Pre-render templates in async tasks if they're complex

---

## Monitoring & Analytics

### Brevo Dashboard

- Track open rates and click rates
- Monitor bounce rates
- View detailed email statistics
- Analyze send history

All emails are tagged for better organization:
- `welcome` - Welcome emails
- `password-reset` - Password reset requests
- `order-confirmation` - Order confirmations
- Custom tags for new email types

---

## Files Reference

| File | Purpose |
|------|---------|
| `notifications.py` | Core email sending functions |
| `examples.py` | Usage examples and patterns |
| `apps.py` | Django app configuration |
| `tests.py` | Unit tests for email functionality |
| `models.py` | Database models (optional) |
| `admin.py` | Django admin interface (optional) |

---

## Next Steps

1. ✅ Add your Brevo API key to `.env`
2. ✅ Import and use email functions in your views
3. ✅ Test email sending in development
4. ✅ Monitor emails in Brevo dashboard
5. ✅ Add more email types as needed
6. 🚀 (Future) Integrate Celery for async sending

---

## Support

For issues or questions:
1. Check the logs: `logger.getLogger('emails')`
2. Review Brevo API documentation
3. Check django-anymail documentation: https://anymail.readthedocs.io
