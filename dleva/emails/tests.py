from django.test import TestCase
from django.core import mail
from django.core.mail import EmailMultiAlternatives
from emails.notifications import (
    send_welcome_email,
    send_password_reset_email,
    send_order_confirmation_email,
    send_notification_email,
    send_email_batch,
)


class EmailNotificationTests(TestCase):
    """Test suite for email notification system."""

    def test_send_welcome_email(self):
        """Test welcome email sends successfully."""
        result = send_welcome_email(
            recipient_email='test@example.com',
            user_name='Test User',
            recipient_name='Test'
        )

        # Check email was queued
        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        # Check email content
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Welcome to Dleva, Test User!')
        self.assertIn('test@example.com', email.to)
        self.assertIn('Test User', email.body)

    def test_send_password_reset_email(self):
        """Test password reset email sends successfully."""
        reset_url = 'https://example.com/reset/token123'
        
        result = send_password_reset_email(
            recipient_email='user@example.com',
            reset_url=reset_url,
            user_name='John Doe',
            recipient_name='John'
        )

        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Password Reset Request - Dleva')
        self.assertIn(reset_url, email.body)

    def test_send_order_confirmation_email(self):
        """Test order confirmation email sends successfully."""
        order_details = {
            'total': '$99.99',
            'items': 5,
            'estimated_delivery': '2025-05-15'
        }

        result = send_order_confirmation_email(
            recipient_email='customer@example.com',
            order_id='ORD-12345',
            user_name='Jane Smith',
            order_details=order_details
        )

        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]
        self.assertIn('ORD-12345', email.subject)
        self.assertIn('ORD-12345', email.body)

    def test_send_notification_email(self):
        """Test generic notification email."""
        message = '<h1>Test Notification</h1><p>This is a test.</p>'

        result = send_notification_email(
            recipient_email='notify@example.com',
            subject='Test Subject',
            message=message,
            tags=['test', 'notification']
        )

        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Test Subject')
        self.assertIn('Test Notification', email.body)

    def test_email_html_alternative(self):
        """Test that HTML alternatives are attached to emails."""
        send_welcome_email(
            recipient_email='test@example.com',
            user_name='Test User'
        )

        email = mail.outbox[0]
        # Check that HTML alternative was attached
        self.assertTrue(len(email.alternatives) > 0)
        self.assertEqual(email.alternatives[0][1], 'text/html')

    def test_send_email_batch(self):
        """Test batch email sending."""
        recipients = [
            'user1@example.com',
            'user2@example.com',
            'user3@example.com'
        ]

        results = send_email_batch(
            email_list=recipients,
            subject='Batch Test',
            html_content='<p>Batch email test</p>',
            tags=['batch', 'test']
        )

        # Check statistics
        self.assertEqual(results['success'], 3)
        self.assertEqual(results['failed'], 0)
        self.assertEqual(len(mail.outbox), 3)

    def test_email_with_recipient_name(self):
        """Test that recipient name is formatted correctly."""
        send_welcome_email(
            recipient_email='test@example.com',
            user_name='John',
            recipient_name='John Doe'
        )

        email = mail.outbox[0]
        # Should format as "Name <email@example.com>"
        self.assertIn('John Doe <test@example.com>', email.to)

    def test_email_without_recipient_name(self):
        """Test email sending without explicit recipient name."""
        send_welcome_email(
            recipient_email='test@example.com',
            user_name='John'
        )

        email = mail.outbox[0]
        self.assertIn('test@example.com', email.to)

    def test_email_text_fallback(self):
        """Test that plain text is generated from HTML when not provided."""
        send_notification_email(
            recipient_email='test@example.com',
            subject='HTML Test',
            message='<h1>Hello</h1><p>This is a test.</p>'
        )

        email = mail.outbox[0]
        # Plain text version should contain stripped HTML
        self.assertIn('Hello', email.body)
        self.assertIn('This is a test.', email.body)
        self.assertNotIn('<h1>', email.body)
