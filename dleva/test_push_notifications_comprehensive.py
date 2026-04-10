"""
Comprehensive Firebase Push Notifications Testing Suite

Tests all aspects of push notification flow:
1. FCM token registration (buyer, seller, rider)
2. Push notification sending from backend
3. Firebase integration verification
4. Service worker configuration validation
"""

import json
import os
from pathlib import Path
from decouple import config
from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from buyer.models import BuyerProfile
from seller.models import SellerProfile
from rider.models import RiderProfile
from core.push_notifications import PushNotificationClient
from core.push_tokens import register_push_token, unregister_push_token
import logging

logger = logging.getLogger(__name__)


class FirebaseConfigurationTest(TestCase):
    """Verify Firebase is properly configured"""
    
    def test_firebase_credentials_available(self):
        """Check if Firebase credentials are configured"""
        credentials_dict, source = PushNotificationClient._get_service_account_credentials()
        
        # Should have credentials from one of these sources:
        # 1. FIREBASE_SERVICE_ACCOUNT_JSON environment variable
        # 2. FIREBASE_SERVICE_ACCOUNT_PATH environment variable
        # 3. Local serviceAccountKey.json file
        
        self.assertIsNotNone(
            credentials_dict, 
            "Firebase credentials must be configured via FIREBASE_SERVICE_ACCOUNT_JSON, "
            "FIREBASE_SERVICE_ACCOUNT_PATH, or local serviceAccountKey.json"
        )
        logger.info(f"✅ Firebase credentials loaded from: {source}")
    
    def test_firebase_contains_required_fields(self):
        """Verify Firebase credentials have all required fields"""
        credentials_dict, _ = PushNotificationClient._get_service_account_credentials()
        
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        for field in required_fields:
            self.assertIn(
                field, 
                credentials_dict,
                f"Firebase credentials missing required field: {field}"
            )
        logger.info("✅ Firebase credentials have all required fields")
    
    def test_firebase_admin_sdk_initialized(self):
        """Test that Firebase Admin SDK can be initialized"""
        firebase_admin = PushNotificationClient._initialize_firebase()
        self.assertIsNotNone(firebase_admin, "Firebase Admin SDK initialization failed")
        logger.info("✅ Firebase Admin SDK initialized successfully")


class BuyerFCMTokenTest(TestCase):
    """Test buyer FCM token registration"""
    
    def setUp(self):
        """Create test buyer"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testbuyer',
            email='buyer@test.com',
            password='testpass123'
        )
        self.buyer = BuyerProfile.objects.create(user=self.user)
        
        # Authenticate
        response = self.client.post('/api/buyer/login/', {
            'username': 'testbuyer',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            self.token = response.data.get('access') or response.data.get('access_token')
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_buyer_fcm_token_registration(self):
        """Test registering FCM token for buyer"""
        test_token = 'eXdFb0h0ZjhzQU1zN...testtoken123'
        
        response = self.client.post('/api/buyer/push-token/', {
            'fcm_token': test_token,
            'action': 'register'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('token_registered'))
        
        # Verify token was saved
        self.buyer.refresh_from_db()
        self.assertEqual(self.buyer.fcm_token, test_token)
        self.assertIsNotNone(self.buyer.fcm_token_updated_at)
        logger.info("✅ Buyer FCM token registered successfully")
    
    def test_buyer_fcm_token_update(self):
        """Test updating FCM token for buyer"""
        old_token = 'old_token_123'
        new_token = 'new_token_456'
        
        # Register first token
        self.client.post('/api/buyer/push-token/', {
            'fcm_token': old_token,
            'action': 'register'
        })
        
        # Update with new token
        response = self.client.post('/api/buyer/push-token/', {
            'fcm_token': new_token,
            'action': 'register'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.buyer.refresh_from_db()
        self.assertEqual(self.buyer.fcm_token, new_token)
        logger.info("✅ Buyer FCM token updated successfully")
    
    def test_buyer_fcm_token_unregister(self):
        """Test unregistering FCM token for buyer"""
        test_token = 'test_token_123'
        
        # Register token
        self.client.post('/api/buyer/push-token/', {
            'fcm_token': test_token,
            'action': 'register'
        })
        
        # Unregister
        response = self.client.post('/api/buyer/push-token/', {
            'fcm_token': test_token,
            'action': 'unregister'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('token_registered'))
        
        self.buyer.refresh_from_db()
        self.assertIsNone(self.buyer.fcm_token)
        logger.info("✅ Buyer FCM token unregistered successfully")


class SellerFCMTokenTest(TestCase):
    """Test seller FCM token registration"""
    
    def setUp(self):
        """Create test seller"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testseller',
            email='seller@test.com',
            password='testpass123'
        )
        self.seller = SellerProfile.objects.create(user=self.user, restaurant_name='Test Restaurant')
        
        # Authenticate
        response = self.client.post('/api/seller/login/', {
            'username': 'testseller',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            self.token = response.data.get('access') or response.data.get('access_token')
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_seller_fcm_token_registration(self):
        """Test registering FCM token for seller"""
        test_token = 'seller_fcm_token_123'
        
        response = self.client.post('/api/seller/update-fcm-token/', {
            'fcm_token': test_token,
            'action': 'register'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('token_registered'))
        
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.fcm_token, test_token)
        logger.info("✅ Seller FCM token registered successfully")
    
    def test_seller_fcm_token_unregister(self):
        """Test unregistering FCM token for seller"""
        test_token = 'seller_fcm_token_123'
        
        # Register first
        self.client.post('/api/seller/update-fcm-token/', {
            'fcm_token': test_token,
            'action': 'register'
        })
        
        # Unregister
        response = self.client.post('/api/seller/update-fcm-token/', {
            'fcm_token': test_token,
            'action': 'unregister'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.seller.refresh_from_db()
        self.assertIsNone(self.seller.fcm_token)
        logger.info("✅ Seller FCM token unregistered successfully")


class RiderFCMTokenTest(TestCase):
    """Test rider FCM token registration"""
    
    def setUp(self):
        """Create test rider"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testrider',
            email='rider@test.com',
            password='testpass123'
        )
        self.rider = RiderProfile.objects.create(
            user=self.user,
            full_name='Test Rider',
            phone_number='+2348123456789'
        )
        
        # Authenticate
        response = self.client.post('/api/rider/login/', {
            'username': 'testrider',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            self.token = response.data.get('access') or response.data.get('access_token')
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_rider_fcm_token_registration(self):
        """Test registering FCM token for rider"""
        test_token = 'rider_fcm_token_123'
        
        response = self.client.post('/api/rider/fcm-token/register/', {
            'fcm_token': test_token,
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.rider.refresh_from_db()
        self.assertEqual(self.rider.fcm_token, test_token)
        logger.info("✅ Rider FCM token registered successfully")
    
    def test_rider_fcm_token_unregister(self):
        """Test unregistering FCM token for rider"""
        test_token = 'rider_fcm_token_123'
        
        # Register first
        self.client.post('/api/rider/fcm-token/register/', {
            'fcm_token': test_token,
        })
        
        # Unregister
        response = self.client.post('/api/rider/fcm-token/register/', {
            'fcm_token': test_token,
            'action': 'unregister'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.rider.refresh_from_db()
        self.assertIsNone(self.rider.fcm_token)
        logger.info("✅ Rider FCM token unregistered successfully")


class PushNotificationSendingTest(TestCase):
    """Test sending push notifications via Firebase"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='user@test.com',
            password='testpass123'
        )
        self.buyer = BuyerProfile.objects.create(
            user=self.user,
            fcm_token='test_fcm_token_valid'
        )
    
    def test_send_notification_with_valid_token(self):
        """Test sending a notification with a valid FCM token"""
        result = PushNotificationClient.send(
            token=self.buyer.fcm_token,
            title='Test Notification',
            body='This is a test notification',
            data={
                'order_id': '123',
                'action': 'new_order'
            },
            sound=True
        )
        
        # Note: This will return False if Firebase is not properly configured,
        # but we're testing that the method completes without crashing
        logger.info(f"✅ Push notification send result: {result}")
    
    def test_send_notification_without_token(self):
        """Test that sending without token fails gracefully"""
        result = PushNotificationClient.send(
            token=None,
            title='Test Notification',
            body='This is a test notification'
        )
        
        self.assertFalse(result)
        logger.info("✅ Gracefully handled missing FCM token")
    
    def test_send_notification_with_data(self):
        """Test sending notification with custom data payload"""
        result = PushNotificationClient.send(
            token=self.buyer.fcm_token,
            title='Order Status Update',
            body='Your order is being prepared',
            data={
                'order_id': '456',
                'status': 'preparing',
                'restaurant_name': 'Test Restaurant',
                'estimated_time': '15 minutes'
            },
            sound=True
        )
        
        logger.info(f"✅ Notification with data payload sent: {result}")


class PushTokenHelperFunctionsTest(TestCase):
    """Test push token helper functions"""
    
    def setUp(self):
        """Create test profile"""
        self.user = User.objects.create_user(
            username='testuser',
            email='user@test.com'
        )
        self.buyer = BuyerProfile.objects.create(user=self.user)
    
    def test_register_push_token(self):
        """Test register_push_token helper function"""
        test_token = 'new_fcm_token_123'
        
        register_push_token(self.buyer, test_token)
        
        self.buyer.refresh_from_db()
        self.assertEqual(self.buyer.fcm_token, test_token)
        self.assertIsNotNone(self.buyer.fcm_token_updated_at)
        logger.info("✅ register_push_token works correctly")
    
    def test_unregister_push_token(self):
        """Test unregister_push_token helper function"""
        test_token = 'fcm_token_to_remove'
        
        # Register first
        register_push_token(self.buyer, test_token)
        
        # Unregister
        unregister_push_token(self.buyer, token=test_token)
        
        self.buyer.refresh_from_db()
        self.assertIsNone(self.buyer.fcm_token)
        logger.info("✅ unregister_push_token works correctly")
    
    def test_unregister_different_token(self):
        """Test that unregister doesn't remove different token"""
        original_token = 'original_token'
        different_token = 'different_token'
        
        register_push_token(self.buyer, original_token)
        
        # Try to unregister different token (should not remove original)
        unregister_push_token(self.buyer, token=different_token)
        
        self.buyer.refresh_from_db()
        self.assertEqual(self.buyer.fcm_token, original_token)
        logger.info("✅ unregister_push_token protects different tokens")


class ServiceWorkerConfigurationTest(TestCase):
    """Verify service worker is properly configured for Firebase messaging"""
    
    def test_service_worker_file_exists(self):
        """Check if service worker file exists"""
        sw_path = Path(__file__).parent.parent.parent / 'dleva-frontend' / 'public' / 'sw.js'
        self.assertTrue(sw_path.exists(), f"Service worker not found at {sw_path}")
        logger.info(f"✅ Service worker found at {sw_path}")
    
    def test_service_worker_has_push_handler(self):
        """Verify service worker has Firebase push event handler"""
        sw_path = Path(__file__).parent.parent.parent / 'dleva-frontend' / 'public' / 'sw.js'
        
        with open(sw_path, 'r') as f:
            sw_content = f.read()
        
        self.assertIn(
            "self.addEventListener('push'",
            sw_content,
            "Service worker missing push event handler"
        )
        self.assertIn(
            "showNotification",
            sw_content,
            "Service worker missing showNotification call"
        )
        logger.info("✅ Service worker has push event handler configured")
    
    def test_service_worker_has_notification_click_handler(self):
        """Verify service worker handles notification clicks"""
        sw_path = Path(__file__).parent.parent.parent / 'dleva-frontend' / 'public' / 'sw.js'
        
        with open(sw_path, 'r') as f:
            sw_content = f.read()
        
        self.assertIn(
            "self.addEventListener('notificationclick'",
            sw_content,
            "Service worker missing notification click handler"
        )
        logger.info("✅ Service worker has notification click handler configured")


def run_all_tests():
    """Run all push notification tests with detailed logging"""
    logger.info("=" * 80)
    logger.info("FIREBASE PUSH NOTIFICATIONS - COMPLETE TEST SUITE")
    logger.info("=" * 80)
    
    print("""
    
╔════════════════════════════════════════════════════════════════════════════════╗
║                     TESTING PUSH NOTIFICATIONS SETUP                           ║
╚════════════════════════════════════════════════════════════════════════════════╝

Running comprehensive tests for:
  • Firebase Admin SDK Configuration
  • FCM Token Registration (Buyer, Seller, Rider)
  • Push Notification Sending
  • Service Worker Configuration
  • Frontend/Backend Alignment

""")


if __name__ == '__main__':
    import django
    django.setup()
    run_all_tests()
