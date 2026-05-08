"""
Test script to verify business_type update is working correctly
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dleva.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from seller.models import SellerProfile

def test_business_type_update():
    """Test that business_type can be updated via the API"""
    print("Testing business_type update...")
    
    # Create a test user
    test_username = 'test_business_type_seller'
    test_user, created = User.objects.get_or_create(
        username=test_username,
        defaults={
            'email': f'{test_username}@test.com',
            'first_name': 'Test',
            'last_name': 'Seller',
        }
    )
    
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✓ Created test user: {test_username}")
    else:
        print(f"✓ Using existing test user: {test_username}")
    
    # Get or create seller profile
    profile, profile_created = SellerProfile.objects.get_or_create(
        user=test_user,
        defaults={
            'business_type': 'restaurant',
            'phone': '+234123456789'
        }
    )
    print(f"✓ Seller profile exists: business_type={profile.business_type}")
    
    # Create API client and authenticate
    client = APIClient()
    refresh = RefreshToken.for_user(test_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    print("✓ API client authenticated")
    
    # Test updating business_type to 'student_vendor'
    print("\nTesting PATCH /seller/profile/update/ with business_type='student_vendor'...")
    response = client.patch(
        '/seller/profile/update/',
        {
            'business_type': 'student_vendor',
            'phone': '+234987654321'
        },
        format='json'
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
    
    if response.status_code in [200, 201]:
        print("✓ API request successful")
        
        # Verify the update in database
        profile.refresh_from_db()
        print(f"✓ Updated profile: business_type={profile.business_type}, phone={profile.phone}")
        
        if profile.business_type == 'student_vendor':
            print("\n✅ SUCCESS: business_type was correctly updated to 'student_vendor'")
            return True
        else:
            print("\n❌ FAILED: business_type was not updated")
            return False
    else:
        print(f"\n❌ FAILED: API request failed with status {response.status_code}")
        if 'error' in response.data:
            print(f"Error: {response.data['error']}")
        if 'details' in response.data:
            print(f"Details: {response.data['details']}")
        return False

if __name__ == '__main__':
    success = test_business_type_update()
    sys.exit(0 if success else 1)
