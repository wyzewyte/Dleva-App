"""
Django management command to test all email notification flows.

Usage:
    python manage.py test_emails                    # Test all functions
    python manage.py test_emails --send-real        # Send test email to andrewrachael13@gmail.com
    python manage.py test_emails --function buyer_otp  # Test specific function
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.utils import timezone
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
from django.db.models import Model


class Command(BaseCommand):
    help = 'Test all email notification flows with dummy data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--send-real',
            action='store_true',
            help='Send a real test email to andrewrachael13@gmail.com'
        )
        parser.add_argument(
            '--function',
            type=str,
            help='Test specific function (e.g., buyer_otp, seller_new_order)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🚀 Starting Email Notification Tests\n'))
        
        # Check if we should send a real email
        if options['send_real']:
            self.send_real_test_email()
            return
        
        # Test specific function or all functions
        if options['function']:
            self.test_specific_function(options['function'])
        else:
            self.test_all_functions()

    def send_real_test_email(self):
        """Send a real test email to verify Brevo integration"""
        self.stdout.write(self.style.WARNING('\n📧 Sending real test email to andrewrachael13@gmail.com...\n'))
        
        try:
            result = send_buyer_otp_verification_email(
                user_email='andrewrachael13@gmail.com',
                user_name='Andrew Test',
                otp='123456'
            )
            
            if result:
                self.stdout.write(self.style.SUCCESS('✅ Real test email sent successfully to andrewrachael13@gmail.com'))
                self.stdout.write(self.style.WARNING('📨 Check your email inbox (might be in spam)'))
            else:
                self.stdout.write(self.style.ERROR('❌ Failed to send real test email'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error sending real test email: {str(e)}'))

    def test_specific_function(self, func_name):
        """Test a specific email function"""
        tests = self.get_all_tests()
        
        test = next((t for t in tests if t['name'] == func_name), None)
        if not test:
            raise CommandError(f'Unknown function: {func_name}. Available: {", ".join(t["name"] for t in tests)}')
        
        self.stdout.write(f'\n📧 Testing: {test["display_name"]}\n')
        self.run_test(test)

    def test_all_functions(self):
        """Test all email notification functions"""
        tests = self.get_all_tests()
        
        results = {
            'passed': [],
            'failed': [],
            'missing_fields': []
        }
        
        # Test each function
        for test in tests:
            self.stdout.write(f'📧 Testing: {test["display_name"]}...', ending=' ')
            sys.stdout.flush()
            
            try:
                result = self.run_test(test)
                if result['success']:
                    results['passed'].append(test['display_name'])
                    self.stdout.write(self.style.SUCCESS('✅'))
                else:
                    results['failed'].append(test['display_name'])
                    self.stdout.write(self.style.ERROR('❌'))
                    if result.get('error'):
                        self.stdout.write(f"   Error: {result['error']}")
                    if result.get('missing_fields'):
                        results['missing_fields'].append({
                            'function': test['display_name'],
                            'missing': result['missing_fields']
                        })
            except Exception as e:
                results['failed'].append(test['display_name'])
                self.stdout.write(self.style.ERROR(f'❌ Exception: {str(e)}'))
        
        # Print summary
        self.print_summary(results)

    def run_test(self, test):
        """Run a single test"""
        try:
            # Call the test function
            result = test['function'](*test['args'])
            
            return {
                'success': True,
                'result': result,
                'missing_fields': test.get('missing_fields', [])
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'missing_fields': test.get('missing_fields', [])
            }

    def get_all_tests(self):
        """Define all test cases"""
        return [
            # ==================== BUYER TESTS ====================
            {
                'name': 'buyer_otp',
                'display_name': '👤 Buyer OTP Verification',
                'function': send_buyer_otp_verification_email,
                'args': ['buyer@test.com', 'John Buyer', '123456'],
            },
            {
                'name': 'buyer_order_confirmed',
                'display_name': '✅ Buyer Order Confirmed',
                'function': self.test_buyer_order_confirmed,
                'args': [],
            },
            {
                'name': 'buyer_order_out_for_delivery',
                'display_name': '🚚 Buyer Order Out for Delivery',
                'function': self.test_buyer_order_out_for_delivery,
                'args': [],
            },
            {
                'name': 'buyer_order_delivered',
                'display_name': '📦 Buyer Order Delivered',
                'function': self.test_buyer_order_delivered,
                'args': [],
            },
            {
                'name': 'buyer_order_cancelled',
                'display_name': '❌ Buyer Order Cancelled',
                'function': self.test_buyer_order_cancelled,
                'args': [],
            },
            {
                'name': 'buyer_password_reset',
                'display_name': '🔐 Buyer Password Reset OTP',
                'function': send_buyer_password_reset_otp_email,
                'args': ['buyer@test.com', 'John Buyer', '654321'],
            },
            
            # ==================== SELLER TESTS ====================
            {
                'name': 'seller_otp',
                'display_name': '🏪 Seller OTP Verification',
                'function': send_seller_otp_verification_email,
                'args': ['seller@test.com', 'Mama Fash Restaurant', '789012'],
            },
            {
                'name': 'seller_new_order',
                'display_name': '📬 Seller New Order Received',
                'function': self.test_seller_new_order,
                'args': [],
            },
            {
                'name': 'seller_order_picked_up',
                'display_name': '🚴 Seller Order Picked Up',
                'function': self.test_seller_order_picked_up,
                'args': [],
            },
            {
                'name': 'seller_payout_processed',
                'display_name': '💰 Seller Payout Processed',
                'function': self.test_seller_payout_processed,
                'args': [],
            },
            {
                'name': 'seller_password_reset',
                'display_name': '🔐 Seller Password Reset OTP',
                'function': send_seller_password_reset_otp_email,
                'args': ['seller@test.com', 'Mama Fash', '345678'],
            },
            
            # ==================== RIDER TESTS ====================
            {
                'name': 'rider_otp',
                'display_name': '🏍️ Rider OTP Verification',
                'function': send_rider_otp_verification_email,
                'args': ['rider@test.com', 'Boda Rider', '456789'],
            },
            {
                'name': 'rider_delivery_assigned',
                'display_name': '📍 Rider New Delivery Assigned',
                'function': self.test_rider_delivery_assigned,
                'args': [],
            },
            {
                'name': 'rider_delivery_completed',
                'display_name': '✨ Rider Delivery Completed',
                'function': self.test_rider_delivery_completed,
                'args': [],
            },
            {
                'name': 'rider_password_reset',
                'display_name': '🔐 Rider Password Reset OTP',
                'function': send_rider_password_reset_otp_email,
                'args': ['rider@test.com', 'Boda', '567890'],
            },
        ]

    # ==================== BUYER TEST HELPERS ====================
    def test_buyer_order_confirmed(self):
        """Create a dummy buyer order and send confirmation email"""
        order = self.create_test_order('confirmed')
        return send_buyer_order_confirmed_email(order)

    def test_buyer_order_out_for_delivery(self):
        """Test buyer order out for delivery email"""
        order = self.create_test_order('on_the_way')
        return send_buyer_order_out_for_delivery_email(order)

    def test_buyer_order_delivered(self):
        """Test buyer order delivered email"""
        order = self.create_test_order('delivered')
        return send_buyer_order_delivered_email(order)

    def test_buyer_order_cancelled(self):
        """Test buyer order cancelled email"""
        order = self.create_test_order('cancelled')
        return send_buyer_order_cancelled_email(
            order,
            cancellation_reason='Out of stock',
            refund_amount=Decimal('2500'),
            refund_status='processed'
        )

    # ==================== SELLER TEST HELPERS ====================
    def test_seller_new_order(self):
        """Create a dummy seller order and send new order email"""
        order = self.create_test_order('pending', for_seller=True)
        return send_seller_new_order_received_email(order)

    def test_seller_order_picked_up(self):
        """Test seller order picked up email"""
        order = self.create_test_order('picked_up', for_seller=True)
        return send_seller_order_picked_up_email(order)

    def test_seller_payout_processed(self):
        """Create a dummy payout and send payout email"""
        payout = self.create_test_payout()
        return send_seller_payout_processed_email(payout)

    # ==================== RIDER TEST HELPERS ====================
    def test_rider_delivery_assigned(self):
        """Create a dummy order with rider and send assignment email"""
        order = self.create_test_order('assigned', with_rider=True)
        return send_rider_new_delivery_assigned_email(order)

    def test_rider_delivery_completed(self):
        """Test rider delivery completed email"""
        order = self.create_test_order('delivered', with_rider=True)
        return send_rider_delivery_completed_email(order)

    # ==================== DUMMY DATA CREATION ====================
    def create_test_order(self, status='pending', for_seller=False, with_rider=False):
        """Create a test order with all necessary fields"""
        # Create or get test user
        buyer_user = User.objects.filter(username='test_buyer').first() or \
                     User.objects.create_user('test_buyer', 'buyer@test.com', 'pass123')
        
        buyer_profile, _ = BuyerProfile.objects.get_or_create(
            user=buyer_user,
            defaults={'phone': '+2341234567890'}
        )
        
        # Create or get restaurant
        restaurant_user = User.objects.filter(username='test_seller').first() or \
                          User.objects.create_user('test_seller', 'seller@test.com', 'pass123')
        
        seller_profile, _ = SellerProfile.objects.get_or_create(
            user=restaurant_user,
            defaults={'restaurant_name': 'Test Restaurant', 'phone': '+2349876543210'}
        )
        
        restaurant, _ = Restaurant.objects.get_or_create(
            seller=seller_profile,
            defaults={'name': 'Test Restaurant', 'address': '123 Test Street'}
        )
        
        # Create order
        order = Order.objects.create(
            buyer=buyer_profile,
            restaurant=restaurant,
            status=status,
            delivery_address='123 Delivery Street, City',
            total_price=Decimal('5000'),
            delivery_fee=Decimal('500'),
            payment_method='card'
        )
        
        # Add order items
        OrderItem.objects.create(
            order=order,
            menu_item_name='Test Food',
            quantity=2,
            price=Decimal('2000'),
            item_total=Decimal('4000')
        )
        
        # Add rider if needed
        if with_rider:
            rider_user = User.objects.filter(username='test_rider').first() or \
                         User.objects.create_user('test_rider', 'rider@test.com', 'pass123')
            
            rider_profile, _ = RiderProfile.objects.get_or_create(
                user=rider_user,
                defaults={
                    'phone_number': '+2348765432109',
                    'full_name': 'Test Rider',
                    'vehicle_type': 'bike'
                }
            )
            
            order.rider = rider_profile
            order.assigned_at = timezone.now()
            order.rider_earning = Decimal('500')
            order.save()
        
        return order

    def create_test_payout(self):
        """Create a test payout with all necessary fields"""
        # Create seller
        seller_user = User.objects.filter(username='test_seller').first() or \
                      User.objects.create_user('test_seller', 'seller@test.com', 'pass123')
        
        seller_profile, _ = SellerProfile.objects.get_or_create(
            user=seller_user,
            defaults={'restaurant_name': 'Test Restaurant', 'phone': '+2349876543210'}
        )
        
        restaurant, _ = Restaurant.objects.get_or_create(
            seller=seller_profile,
            defaults={'name': 'Test Restaurant', 'address': '123 Test Street'}
        )
        
        # Create payout (uses seller, not restaurant)
        payout = Payout.objects.create(
            seller=seller_profile,
            amount=Decimal('25000'),
            status='completed'
        )
        
        # Create payout details
        PayoutDetails.objects.get_or_create(
            seller=seller_profile,
            defaults={
                'account_holder_name': 'Test Seller',
                'bank_name': 'Test Bank',
                'account_number': '1234567890',
                'account_type': 'business',
                'verified': True
            }
        )
        
        return payout

    def print_summary(self, results):
        """Print test results summary"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'\n✅ PASSED: {len(results["passed"])} tests'))
        for test in results['passed']:
            self.stdout.write(f'  ✓ {test}')
        
        if results['failed']:
            self.stdout.write(self.style.ERROR(f'\n❌ FAILED: {len(results["failed"])} tests'))
            for test in results['failed']:
                self.stdout.write(f'  ✗ {test}')
        
        if results['missing_fields']:
            self.stdout.write(self.style.WARNING(f'\n⚠️  MISSING FIELDS DETECTED:'))
            for item in results['missing_fields']:
                self.stdout.write(f'  {item["function"]}:')
                for field in item['missing']:
                    self.stdout.write(f'    - {field}')
        
        total = len(results['passed']) + len(results['failed'])
        success_rate = (len(results['passed']) / total * 100) if total > 0 else 0
        self.stdout.write(f'\n📊 Success Rate: {success_rate:.1f}% ({len(results["passed"])}/{total})')
        self.stdout.write('='*60 + '\n')
