"""
Complete Cloudinary Integration Test
Tests upload endpoints, model updates, and serializer output
"""

import os
import sys
import json
from pathlib import Path
from io import BytesIO
from PIL import Image
from decouple import config

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from seller.models import SellerProfile, Restaurant, MenuItem
from buyer.models import BuyerProfile
from core.cloudinary_service import get_cloudinary_service
from seller.serializers import SellerProfileSerializer, SellerMenuItemSerializer, RestaurantSettingsSerializer


def create_test_image():
    """Create a test image file"""
    img = Image.new('RGB', (100, 100), color='blue')
    img_io = BytesIO()
    img.save(img_io, 'JPEG')
    img_io.seek(0)
    img_io.name = 'test_image.jpg'
    img_io.content_type = 'image/jpeg'
    return img_io


def get_auth_headers(user):
    """Get JWT authentication headers for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'HTTP_AUTHORIZATION': f'Bearer {str(refresh.access_token)}'
    }


def test_seller_profile_upload():
    """Test 1: Upload seller profile image"""
    print("\n" + "="*60)
    print("TEST 1: Upload Seller Profile Image")
    print("="*60)
    try:
        # Create test user and seller profile
        user = User.objects.create_user(
            username='test_seller_1',
            email='seller1@test.com',
            password='testpass123'
        )
        seller_profile = SellerProfile.objects.create(
            user=user,
            restaurant_name='Test Restaurant',
            business_type='restaurant'
        )
        
        client = APIClient()
        client.credentials(**get_auth_headers(user))
        
        # Upload image
        test_image = create_test_image()
        response = client.post(
            '/api/seller/upload-profile-image/',
            {'image': test_image},
            format='multipart'
        )
        
        if response.status_code == 201:
            print("✅ Image uploaded successfully")
            data = response.json()
            print(f"   Public ID: {data.get('public_id')}")
            print(f"   URL: {data.get('url')}")
            
            # Verify database was updated
            seller_profile.refresh_from_db()
            if seller_profile.cloudinary_image_id:
                print(f"✅ Database updated with cloudinary_image_id")
                return True
            else:
                print("❌ Database not updated")
                return False
        else:
            print(f"❌ Upload failed: {response.json()}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_menu_item_upload():
    """Test 2: Upload menu item image"""
    print("\n" + "="*60)
    print("TEST 2: Upload Menu Item Image")
    print("="*60)
    try:
        # Create test user, seller, restaurant, and menu item
        user = User.objects.create_user(
            username='test_seller_2',
            email='seller2@test.com',
            password='testpass123'
        )
        seller_profile = SellerProfile.objects.create(
            user=user,
            restaurant_name='Test Restaurant 2',
            business_type='restaurant'
        )
        restaurant = Restaurant.objects.create(
            seller=seller_profile,
            name='Test Restaurant 2',
            address='123 Test St'
        )
        menu_item = MenuItem.objects.create(
            restaurant=restaurant,
            name='Test Dish',
            description='A delicious test dish',
            price=15.99,
            available=True
        )
        
        client = APIClient()
        client.credentials(**get_auth_headers(user))
        
        # Upload image
        test_image = create_test_image()
        response = client.post(
            '/api/menu-item/upload-image/',
            {'image': test_image, 'menu_item_id': menu_item.id},
            format='multipart'
        )
        
        if response.status_code == 201:
            print("✅ Menu item image uploaded successfully")
            data = response.json()
            print(f"   Public ID: {data.get('public_id')}")
            print(f"   URL: {data.get('url')}")
            
            # Verify database was updated
            menu_item.refresh_from_db()
            if menu_item.cloudinary_image_id:
                print(f"✅ Database updated with cloudinary_image_id")
                return True
            else:
                print("❌ Database not updated")
                return False
        else:
            print(f"❌ Upload failed: {response.json()}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_restaurant_upload():
    """Test 3: Upload restaurant image"""
    print("\n" + "="*60)
    print("TEST 3: Upload Restaurant Image")
    print("="*60)
    try:
        # Create test user, seller, and restaurant
        user = User.objects.create_user(
            username='test_seller_3',
            email='seller3@test.com',
            password='testpass123'
        )
        seller_profile = SellerProfile.objects.create(
            user=user,
            restaurant_name='Test Restaurant 3',
            business_type='restaurant'
        )
        restaurant = Restaurant.objects.create(
            seller=seller_profile,
            name='Test Restaurant 3',
            address='456 Test Ave'
        )
        
        client = APIClient()
        client.credentials(**get_auth_headers(user))
        
        # Upload image
        test_image = create_test_image()
        response = client.post(
            '/api/restaurant/upload-image/',
            {'image': test_image},
            format='multipart'
        )
        
        if response.status_code == 201:
            print("✅ Restaurant image uploaded successfully")
            data = response.json()
            print(f"   Public ID: {data.get('public_id')}")
            print(f"   URL: {data.get('url')}")
            
            # Verify database was updated
            restaurant.refresh_from_db()
            if restaurant.cloudinary_image_id:
                print(f"✅ Database updated with cloudinary_image_id")
                return True
            else:
                print("❌ Database not updated")
                return False
        else:
            print(f"❌ Upload failed: {response.json()}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_serializer_output():
    """Test 4: Verify serializers include Cloudinary fields"""
    print("\n" + "="*60)
    print("TEST 4: Verify Serializer Output")
    print("="*60)
    try:
        # Create test seller
        user = User.objects.create_user(
            username='test_seller_4',
            email='seller4@test.com',
            password='testpass123'
        )
        seller_profile = SellerProfile.objects.create(
            user=user,
            restaurant_name='Test Restaurant 4',
            business_type='restaurant',
            cloudinary_image_id='seller_images/test_seller_4',
            cloudinary_image_url='https://res.cloudinary.com/dx4ssfcse/image/upload/v1/test'
        )
        
        # Serialize
        serializer = SellerProfileSerializer(seller_profile)
        data = serializer.data
        
        if 'cloudinary_image_id' in data and 'cloudinary_image_url' in data:
            print("✅ SellerProfileSerializer includes Cloudinary fields")
            print(f"   cloudinary_image_id: {data['cloudinary_image_id']}")
            print(f"   cloudinary_image_url: {data['cloudinary_image_url']}")
            return True
        else:
            print("❌ Cloudinary fields not in serializer output")
            return False
    
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_delete_image():
    """Test 5: Delete image from Cloudinary"""
    print("\n" + "="*60)
    print("TEST 5: Delete Image Test")
    print("="*60)
    try:
        # Upload a test image first
        cloudinary_service = get_cloudinary_service()
        test_image = create_test_image()
        
        result = cloudinary_service.upload_image(
            test_image,
            folder='test',
            public_id='test_delete_image'
        )
        
        if not result['success']:
            print(f"❌ Could not upload test image: {result.get('error')}")
            return False
        
        public_id = result['public_id']
        
        # Now delete it
        user = User.objects.create_user(
            username='test_user_delete',
            email='delete@test.com',
            password='testpass123'
        )
        
        client = APIClient()
        client.credentials(**get_auth_headers(user))
        
        response = client.delete(
            '/api/images/delete/',
            {'public_id': public_id},
            format='json'
        )
        
        if response.status_code == 200:
            print("✅ Image deleted successfully")
            return True
        else:
            print(f"❌ Delete failed: {response.json()}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def test_optimized_url():
    """Test 6: Get optimized image URL"""
    print("\n" + "="*60)
    print("TEST 6: Get Optimized Image URL")
    print("="*60)
    try:
        client = APIClient()
        
        response = client.get(
            '/api/images/optimized/',
            {'public_id': 'seller_images/test', 'width': 300, 'height': 300}
        )
        
        if response.status_code == 200:
            print("✅ Optimized URL generated successfully")
            data = response.json()
            print(f"   URL: {data['url']}")
            return True
        else:
            print(f"❌ Failed: {response.json()}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*10 + "CLOUDINARY INTEGRATION END-TO-END TEST" + " "*10 + "║")
    print("╚" + "="*58 + "╝")
    
    results = {}
    
    results['seller_upload'] = test_seller_profile_upload()
    results['menu_item_upload'] = test_menu_item_upload()
    results['restaurant_upload'] = test_restaurant_upload()
    results['serializer_output'] = test_serializer_output()
    results['delete_image'] = test_delete_image()
    results['optimized_url'] = test_optimized_url()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status_str = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper().ljust(30)}: {status_str}")
    
    print("="*60)
    print(f"TOTAL: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL INTEGRATION TESTS PASSED!")
        print("✅ Cloudinary upload endpoints working correctly")
        print("✅ Database fields updating as expected")
        print("✅ Serializers including Cloudinary URLs")
        print("✅ Image operations (upload, delete, optimize) working")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check errors above.")
    
    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    main()
