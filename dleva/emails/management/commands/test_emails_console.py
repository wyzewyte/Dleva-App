"""
Django management command to test email notifications safely with console backend.

Usage:
    python manage.py test_emails_console                    # Test all with console backend
    python manage.py test_emails_console --send-real email  # Send real email to Brevo
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from datetime import timedelta
from decimal import Decimal
import sys

# Import all notification functions
from emails.notifications import (
    # Buyer
    send_buyer_otp_verification_email,
    send_buyer_order_confirmed_email,
    send_buyer_order_out_for_delivery_email,
    send_buyer_order_delivered_email,
    send_buyer_order_cancelled_email,
    send_buyer_password_reset_otp_email,
    # Seller
    send_seller_otp_verification_email,
    send_seller_new_order_received_email,
    send_seller_order_picked_up_email,
    send_seller_payout_processed_email,
    send_seller_password_reset_otp_email,
    # Rider
    send_rider_otp_verification_email,
    send_rider_new_delivery_assigned_email,
    send_rider_delivery_completed_email,
    send_rider_password_reset_otp_email,
)

from buyer.models import BuyerProfile, Order, OrderItem
from seller.models import SellerProfile, Restaurant, Payout, PayoutDetails
from rider.models import RiderProfile


class Command(BaseCommand):
    help = 'Test all email notifications with console backend (safe testing without real emails)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--send-real',
            type=str,
            metavar='email',
            help='Send a real test email to specified address (e.g., --send-real user@example.com)'
        )

    def handle(self, *args, **options):
        # Set UTF-8 encoding for console output (needed for unicode chars)
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8')
        
        self.stdout.write(self.style.SUCCESS('\n>>> Email Notification Test Suite\n'))
        
        if options['send_real']:
            self.test_real_send(options['send_real'])
        else:
            # Temporarily use console backend for safe testing
            original_backend = settings.EMAIL_BACKEND
            settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
            try:
                self.test_console_backend()
            finally:
                # Restore original backend
                settings.EMAIL_BACKEND = original_backend

    def test_console_backend(self):
        """Test all email functions with console backend"""
        self.stdout.write(self.style.WARNING('>>> Using Django Console Email Backend (emails will display in console)\n'))
        self.stdout.write(self.style.WARNING('>>> No real emails will be sent. This safely tests all templates.\n'))
        self.stdout.write('='*70 + '\n')
        
        tests = self.get_all_tests()
        results = {'passed': 0, 'failed': 0, 'errors': []}
        
        for i, test in enumerate(tests, 1):
            self.stdout.write(f'{i:2d}. {test["display_name"]:45s} ', ending='')
            sys.stdout.flush()
            
            try:
                result = test['function'](*test['args'])
                if result:
                    results['passed'] += 1
                    self.stdout.write(self.style.SUCCESS('[OK]'))
                else:
                    results['failed'] += 1
                    self.stdout.write(self.style.ERROR('[FAILED] (returned False)'))
                    results['errors'].append(f"{test['display_name']}: returned False")
            except Exception as e:
                results['failed'] += 1
                self.stdout.write(self.style.ERROR(f'[ERROR]'))
                results['errors'].append(f"{test['display_name']}: {str(e)}")
        
        # Print summary
        self.print_summary(results)

    def test_real_send(self, email_address):
        """Send a real test email to the specified address"""
        self.stdout.write(self.style.WARNING(f'\n>>> Sending Real Test Email to {email_address}\n'))
        
        try:
            result = send_buyer_otp_verification_email(
                user_email=email_address,
                user_name='Test User',
                otp='123456'
            )
            
            if result:
                self.stdout.write(self.style.SUCCESS(f'[OK] Test email sent successfully to {email_address}'))
                self.stdout.write(self.style.WARNING('\n>>> Please check your email inbox (may take a few seconds)'))
                self.stdout.write(self.style.WARNING('>>> If not found, check spam/promotions folder'))
            else:
                self.stdout.write(self.style.ERROR(f'[FAILED] Failed to send email: email function returned False'))
                self.stdout.write(self.style.WARNING('\n>>> Verify your BREVO_API_KEY in .env is correct'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[ERROR] Error sending email: {str(e)}'))
            self.stdout.write(self.style.WARNING('\n>>> Verify your BREVO_API_KEY in .env is correct'))
            self.stdout.write(self.style.WARNING('>>> Format should be: yxkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx'))

    def get_all_tests(self):
        """Define all test cases"""
        return [
            # ==================== BUYER TESTS ====================
            {'name': 'buyer_otp', 'display_name': '[BUYER] OTP Verification', 'function': send_buyer_otp_verification_email, 'args': ['buyer@test.com', 'John Buyer', '123456']},
            {'name': 'buyer_order_confirmed', 'display_name': '[BUYER] Order Confirmed', 'function': self.test_buyer_order_confirmed, 'args': []},
            {'name': 'buyer_order_out_for_delivery', 'display_name': '[BUYER] Order Out for Delivery', 'function': self.test_buyer_order_out_for_delivery, 'args': []},
            {'name': 'buyer_order_delivered', 'display_name': '[BUYER] Order Delivered', 'function': self.test_buyer_order_delivered, 'args': []},
            {'name': 'buyer_order_cancelled', 'display_name': '[BUYER] Order Cancelled', 'function': self.test_buyer_order_cancelled, 'args': []},
            {'name': 'buyer_password_reset', 'display_name': '[BUYER] Password Reset OTP', 'function': send_buyer_password_reset_otp_email, 'args': ['buyer@test.com', 'John Buyer', '654321']},
            
            # ==================== SELLER TESTS ====================
            {'name': 'seller_otp', 'display_name': '[SELLER] OTP Verification', 'function': send_seller_otp_verification_email, 'args': ['seller@test.com', 'Mama Fash', '789012']},
            {'name': 'seller_new_order', 'display_name': '[SELLER] New Order Received', 'function': self.test_seller_new_order, 'args': []},
            {'name': 'seller_order_picked_up', 'display_name': '[SELLER] Order Picked Up', 'function': self.test_seller_order_picked_up, 'args': []},
            {'name': 'seller_payout_processed', 'display_name': '[SELLER] Payout Processed', 'function': self.test_seller_payout_processed, 'args': []},
            {'name': 'seller_password_reset', 'display_name': '[SELLER] Password Reset OTP', 'function': send_seller_password_reset_otp_email, 'args': ['seller@test.com', 'Mama Fash', '345678']},
            
            # ==================== RIDER TESTS ====================
            {'name': 'rider_otp', 'display_name': '[RIDER] OTP Verification', 'function': send_rider_otp_verification_email, 'args': ['rider@test.com', 'Boda Rider', '456789']},
            {'name': 'rider_delivery_assigned', 'display_name': '[RIDER] New Delivery Assigned', 'function': self.test_rider_delivery_assigned, 'args': []},
            {'name': 'rider_delivery_completed', 'display_name': '[RIDER] Delivery Completed', 'function': self.test_rider_delivery_completed, 'args': []},
            {'name': 'rider_password_reset', 'display_name': '[RIDER] Password Reset OTP', 'function': send_rider_password_reset_otp_email, 'args': ['rider@test.com', 'Boda', '567890']},
        ]

    # ==================== BUYER TEST HELPERS ====================
    def test_buyer_order_confirmed(self):
        order = self.create_test_order('confirming')
        return send_buyer_order_confirmed_email(order)

    def test_buyer_order_out_for_delivery(self):
        order = self.create_test_order('on_the_way')
        return send_buyer_order_out_for_delivery_email(order)

    def test_buyer_order_delivered(self):
        order = self.create_test_order('delivered')
        return send_buyer_order_delivered_email(order)

    def test_buyer_order_cancelled(self):
        order = self.create_test_order('cancelled')
        return send_buyer_order_cancelled_email(order, 'Out of stock', Decimal('2500'), 'processed')

    # ==================== SELLER TEST HELPERS ====================
    def test_seller_new_order(self):
        order = self.create_test_order('pending', for_seller=True)
        return send_seller_new_order_received_email(order)

    def test_seller_order_picked_up(self):
        order = self.create_test_order('picked_up', for_seller=True)
        return send_seller_order_picked_up_email(order)

    def test_seller_payout_processed(self):
        payout = self.create_test_payout()
        return send_seller_payout_processed_email(payout)

    # ==================== RIDER TEST HELPERS ====================
    def test_rider_delivery_assigned(self):
        order = self.create_test_order('assigned', with_rider=True)
        return send_rider_new_delivery_assigned_email(order)

    def test_rider_delivery_completed(self):
        order = self.create_test_order('delivered', with_rider=True)
        return send_rider_delivery_completed_email(order)

    # ==================== DUMMY DATA CREATION ====================
    def create_test_order(self, status='pending', for_seller=False, with_rider=False):
        """Create a test order with all necessary fields"""
        buyer_user = User.objects.filter(username='test_buyer').first() or \
                     User.objects.create_user('test_buyer', 'buyer@test.com', 'pass123')
        buyer_profile, _ = BuyerProfile.objects.get_or_create(user=buyer_user, defaults={'phone': '+2341234567890'})
        
        restaurant_user = User.objects.filter(username='test_seller').first() or \
                          User.objects.create_user('test_seller', 'seller@test.com', 'pass123')
        seller_profile, _ = SellerProfile.objects.get_or_create(user=restaurant_user, defaults={'restaurant_name': 'Test Restaurant', 'phone': '+2349876543210'})
        
        restaurant, _ = Restaurant.objects.get_or_create(seller=seller_profile, defaults={'name': 'Test Restaurant', 'address': '123 Test Street'})
        
        order = Order.objects.create(
            buyer=buyer_profile,
            restaurant=restaurant,
            status=status,
            delivery_address='123 Delivery Street, City',
            total_price=Decimal('5000'),
            delivery_fee=Decimal('500'),
            payment_method='card'
        )
        
        # Import MenuItem
        from seller.models import MenuItem
        menu_item, _ = MenuItem.objects.get_or_create(
            restaurant=restaurant,
            defaults={'name': 'Test Food', 'description': 'Test Item', 'price': Decimal('2000')}
        )
        
        # Create OrderItem with proper ForeignKey
        OrderItem.objects.get_or_create(
            order=order,
            menu_item=menu_item,
            defaults={'quantity': 2, 'price': Decimal('2000')}
        )
        
        # For seller notifications, we need a cart with items for email template
        if for_seller:
            from buyer.models import Cart, CartItem
            cart, _ = Cart.objects.get_or_create(buyer=buyer_profile, restaurant=restaurant)
            # Add cart items if not exists
            CartItem.objects.get_or_create(
                cart=cart,
                menu_item=menu_item,
                defaults={'quantity': 2}
            )
        
        # For delivery-related notifications, we need a rider
        if status in ['on_the_way', 'delivered', 'assigned', 'picked_up'] or with_rider:
            rider_user = User.objects.filter(username='test_rider').first() or \
                         User.objects.create_user('test_rider', 'rider@test.com', 'pass123')
            rider_profile, _ = RiderProfile.objects.get_or_create(user=rider_user, defaults={
                'phone_number': '+2348765432109',
                'full_name': 'Test Rider',
                'vehicle_type': 'bike'
            })
            order.rider = rider_profile
            order.assigned_at = timezone.now()
            order.rider_earning = Decimal('500')
            order.save()
        
        return order

    def create_test_payout(self):
        """Create a test payout"""
        seller_user = User.objects.filter(username='test_seller').first() or \
                      User.objects.create_user('test_seller', 'seller@test.com', 'pass123')
        seller_profile, _ = SellerProfile.objects.get_or_create(user=seller_user, defaults={'restaurant_name': 'Test Restaurant', 'phone': '+2349876543210'})
        
        restaurant, _ = Restaurant.objects.get_or_create(seller=seller_profile, defaults={'name': 'Test Restaurant', 'address': '123 Test Street'})
        
        payout = Payout.objects.create(seller=seller_profile, amount=Decimal('25000'), status='completed')
        
        PayoutDetails.objects.get_or_create(seller=seller_profile, defaults={
            'account_name': 'Test Seller',
            'bank_name': 'Test Bank',
            'account_number': '1234567890',
            'verified': True
        })
        
        return payout

    def print_summary(self, results):
        """Print test results summary"""
        self.stdout.write('\n' + '='*70)
        
        if results['failed'] == 0:
            self.stdout.write(self.style.SUCCESS(f'\n[SUCCESS] ALL TESTS PASSED! ({results["passed"]}/{results["passed"] + results["failed"]})\n'))
        else:
            self.stdout.write(self.style.WARNING(f'\n[INFO] {results["passed"]}/{results["passed"] + results["failed"]} tests passed\n'))
            
            if results['errors']:
                self.stdout.write(self.style.ERROR('Errors:'))
                for error in results['errors']:
                    self.stdout.write(f'  [ERROR] {error}')
        
        self.stdout.write('='*70 + '\n')
        
        if results['failed'] == 0:
            self.stdout.write(self.style.SUCCESS('[SUCCESS] All email templates rendered successfully!'))
            self.stdout.write(self.style.SUCCESS('[SUCCESS] Ready for production (verify BREVO_API_KEY in .env)\n'))
        else:
            self.stdout.write(self.style.WARNING('\n[INFO] Check the errors above and fix them before production.\n'))
