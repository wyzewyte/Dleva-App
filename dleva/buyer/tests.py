from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from seller.models import MenuItem, Restaurant, SellerProfile
from utils.paystack_service import convert_to_kobo

from .models import BuyerProfile, Order, Payment
from .views import calculate_backend_delivery_fee


class PaymentCompleteViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.buyer_user = User.objects.create_user(
            username='buyer',
            email='buyer@example.com',
            password='password123',
        )
        self.buyer = BuyerProfile.objects.create(user=self.buyer_user, phone='08030000000')

        seller_user = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='password123',
        )
        self.seller = SellerProfile.objects.create(
            user=seller_user,
            restaurant_name='Backend Bistro',
        )
        self.restaurant = Restaurant.objects.create(
            seller=self.seller,
            name='Backend Bistro',
            address='Victoria Island, Lagos',
            latitude=Decimal('6.42810000'),
            longitude=Decimal('3.42190000'),
        )
        self.menu_item = MenuItem.objects.create(
            restaurant=self.restaurant,
            name='Jollof Rice',
            price=Decimal('2500.00'),
            available=True,
        )
        self.client.force_authenticate(self.buyer_user)

    @patch('buyer.views.SellerPushNotificationService.send_new_order')
    @patch('buyer.views.PaystackService.verify_payment')
    def test_payment_complete_ignores_submitted_delivery_fee(self, mock_verify_payment, _mock_send_new_order):
        delivery_latitude = Decimal('6.52440000')
        delivery_longitude = Decimal('3.37920000')
        fee_data = calculate_backend_delivery_fee(
            self.restaurant,
            delivery_latitude,
            delivery_longitude,
        )
        expected_total = self.menu_item.price + fee_data['total_fee']
        mock_verify_payment.return_value = {
            'success': True,
            'verified': True,
            'status': 'completed',
            'reference': 'DLV_TEST_REFERENCE',
            'amount': convert_to_kobo(expected_total),
            'currency': 'NGN',
        }

        response = self.client.post(
            '/api/buyer/payment/complete/',
            {
                'reference': 'DLV_TEST_REFERENCE',
                'restaurant_id': self.restaurant.id,
                'delivery_address': 'Yaba, Lagos',
                'delivery_latitude': str(delivery_latitude),
                'delivery_longitude': str(delivery_longitude),
                'delivery_fee': '1.00',
                'cartItems': [
                    {
                        'id': self.menu_item.id,
                        'quantity': 1,
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        order = Order.objects.get()
        payment = Payment.objects.get(order=order)
        self.assertEqual(order.delivery_fee, fee_data['total_fee'])
        self.assertNotEqual(order.delivery_fee, Decimal('1.00'))
        self.assertEqual(order.total_price, expected_total)
        self.assertEqual(payment.amount, expected_total)
        self.assertEqual(order.distance_km, fee_data['distance_km'])
        self.assertEqual(order.rider_earning, fee_data['rider_earning'])
        self.assertEqual(order.platform_commission, fee_data['platform_commission'])
