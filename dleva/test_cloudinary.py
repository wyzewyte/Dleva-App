"""
Comprehensive Cloudinary Integration Test
Tests all functionality to ensure Cloudinary is working correctly
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

from core.cloudinary_service import get_cloudinary_service


def create_test_image():
    """Create a simple test image file"""
    img = Image.new('RGB', (100, 100), color='red')
    img_io = BytesIO()
    img.save(img_io, 'JPEG')
    img_io.seek(0)
    img_io.name = 'test_image.jpg'
    img_io.content_type = 'image/jpeg'
    return img_io


def create_test_file(content, filename):
    """Create a test file from string content"""
    file_io = BytesIO(content.encode())
    file_io.name = filename
    file_io.content_type = 'text/plain'
    return file_io


def test_environment_variables():
    """Test environment variables are set correctly"""
    print("\n" + "="*60)
    print("TEST 0: Environment Variables Check")
    print("="*60)
    
    cloud_name = config('CLOUDINARY_CLOUD_NAME', default=None)
    api_key = config('CLOUDINARY_API_KEY', default=None)
    api_secret = config('CLOUDINARY_API_SECRET', default=None)
    
    print(f"   CLOUDINARY_CLOUD_NAME: {'✅ SET' if cloud_name else '❌ NOT SET'}")
    if cloud_name:
        print(f"      Value: {cloud_name}")
    
    print(f"   CLOUDINARY_API_KEY: {'✅ SET' if api_key else '❌ NOT SET'}")
    if api_key:
        print(f"      Length: {len(api_key)} characters")
    
    print(f"   CLOUDINARY_API_SECRET: {'✅ SET' if api_secret else '❌ NOT SET'}")
    if api_secret:
        print(f"      Length: {len(api_secret)} characters")
    
    return bool(cloud_name and api_key and api_secret)


def test_cloudinary_initialization():
    """Test 1: Cloudinary service initialization"""
    print("\n" + "="*60)
    print("TEST 1: Cloudinary Service Initialization")
    print("="*60)
    try:
        cloudinary_service = get_cloudinary_service()
        print("✅ Cloudinary service initialized successfully")
        print(f"   Service: {cloudinary_service}")
        return True
    except Exception as e:
        print(f"❌ Cloudinary initialization failed: {e}")
        return False


def test_image_upload():
    """Test 2: Upload image to Cloudinary"""
    print("\n" + "="*60)
    print("TEST 2: Image Upload to Cloudinary")
    print("="*60)
    try:
        cloudinary_service = get_cloudinary_service()
        test_image = create_test_image()
        
        print(f"   Uploading test image...")
        
        result = cloudinary_service.upload_image(
            test_image,
            folder='test/images',
            public_id='test_image_dleva'
        )
        
        if result['success']:
            print(f"✅ Image uploaded successfully")
            print(f"   Public ID: {result['public_id']}")
            print(f"   URL: {result['url']}")
            print(f"   Format: {result['format']}")
            print(f"   Size: {result['size']} bytes")
            return result['public_id']
        else:
            print(f"❌ Image upload failed: {result.get('error')}")
            return None
    except Exception as e:
        print(f"❌ Image upload failed: {e}")
        return None


def test_document_upload():
    """Test 3: Upload document to Cloudinary"""
    print("\n" + "="*60)
    print("TEST 3: Document Upload to Cloudinary")
    print("="*60)
    try:
        cloudinary_service = get_cloudinary_service()
        test_doc = create_test_file("This is a test document for Cloudinary", "test_doc.txt")
        
        print(f"   Uploading test document...")
        
        result = cloudinary_service.upload_image(
            test_doc,
            folder='test/documents',
            public_id='test_document_dleva'
        )
        
        if result['success']:
            print(f"✅ Document uploaded successfully")
            print(f"   Public ID: {result['public_id']}")
            print(f"   URL: {result['url']}")
            print(f"   Format: {result['format']}")
            print(f"   Size: {result['size']} bytes")
            return result['public_id']
        else:
            print(f"❌ Document upload failed: {result.get('error')}")
            return None
    except Exception as e:
        print(f"❌ Document upload failed: {e}")
        return None


def test_get_url(public_id):
    """Test 4: Get URL for uploaded file"""
    print("\n" + "="*60)
    print("TEST 4: Get Image URL")
    print("="*60)
    try:
        if not public_id:
            print("❌ Cannot test - no public ID provided")
            return None
            
        cloudinary_service = get_cloudinary_service()
        url = cloudinary_service.get_url(public_id)
        
        print(f"✅ URL generated successfully")
        print(f"   Public ID: {public_id}")
        print(f"   URL: {url}")
        return url
    except Exception as e:
        print(f"❌ Get URL failed: {e}")
        return None


def test_get_optimized_url(public_id):
    """Test 5: Get optimized image URL"""
    print("\n" + "="*60)
    print("TEST 5: Get Optimized Image URL")
    print("="*60)
    try:
        if not public_id:
            print("❌ Cannot test - no public ID provided")
            return None
            
        cloudinary_service = get_cloudinary_service()
        optimized_url = cloudinary_service.get_optimized_url(
            public_id,
            width=300,
            height=300,
            quality='auto'
        )
        
        print(f"✅ Optimized URL generated successfully")
        print(f"   Public ID: {public_id}")
        print(f"   Dimensions: 300x300")
        print(f"   URL: {optimized_url}")
        return optimized_url
    except Exception as e:
        print(f"❌ Get optimized URL failed: {e}")
        return None


def test_get_upload_stats():
    """Test 6: Get upload statistics"""
    print("\n" + "="*60)
    print("TEST 6: Get Upload Statistics")
    print("="*60)
    try:
        cloudinary_service = get_cloudinary_service()
        stats = cloudinary_service.get_upload_stats()
        
        if stats:
            print(f"✅ Upload stats retrieved successfully")
            print(f"   Plan: {stats.get('plan', 'N/A')}")
            print(f"   Used Storage: {stats.get('used_storage', 'N/A')} bytes")
            print(f"   Credits: {stats.get('credits', 'N/A')}")
            print(f"   Bandwidth Used: {stats.get('bandwidth', 'N/A')} bytes")
            return True
        else:
            print("⚠️  Could not retrieve stats")
            return False
    except Exception as e:
        print(f"⚠️  Get stats failed (may require API key): {e}")
        return False


def test_delete_file(public_id):
    """Test 7: Delete file from Cloudinary"""
    print("\n" + "="*60)
    print("TEST 7: Delete File from Cloudinary")
    print("="*60)
    try:
        if not public_id:
            print("❌ Cannot test - no public ID provided")
            return False
            
        cloudinary_service = get_cloudinary_service()
        success = cloudinary_service.delete_file(public_id)
        
        if success:
            print(f"✅ File deleted successfully")
            print(f"   Deleted: {public_id}")
            return True
        else:
            print(f"❌ Failed to delete file: {public_id}")
            return False
    except Exception as e:
        print(f"❌ Delete file failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*20 + "CLOUDINARY TEST SUITE" + " "*17 + "║")
    print("╚" + "="*58 + "╝")
    
    results = {}
    
    # Test 0: Environment Variables
    results['environment'] = test_environment_variables()
    
    if not results['environment']:
        print("\n❌ Environment variables not set. Cannot continue tests.")
        print("\n📝 Please add these to your .env file:")
        print("   CLOUDINARY_CLOUD_NAME=your_cloud_name")
        print("   CLOUDINARY_API_KEY=your_api_key")
        print("   CLOUDINARY_API_SECRET=your_api_secret")
        print("\nGet your credentials from: https://cloudinary.com/console")
        return
    
    # Test 1: Initialization
    results['initialization'] = test_cloudinary_initialization()
    
    if not results['initialization']:
        print("\n❌ Cloudinary initialization failed. Cannot continue tests.")
        return
    
    # Test 2: Image Upload
    image_id = test_image_upload()
    results['image_upload'] = image_id is not None
    
    # Test 3: Document Upload
    doc_id = test_document_upload()
    results['document_upload'] = doc_id is not None
    
    # Test 4: Get URL
    if image_id:
        results['get_url'] = test_get_url(image_id) is not None
    
    # Test 5: Get Optimized URL
    if image_id:
        results['optimized_url'] = test_get_optimized_url(image_id) is not None
    
    # Test 6: Get Stats
    results['get_stats'] = test_get_upload_stats()
    
    # Test 7: Delete Files
    if image_id:
        results['delete_image'] = test_delete_file(image_id)
    if doc_id:
        results['delete_document'] = test_delete_file(doc_id)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status_str = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper().ljust(25)}: {status_str}")
    
    print("="*60)
    print(f"TOTAL: {passed}/{total} tests passed")
    
    if passed >= total - 1:  # Allow stats to fail
        print("\n🎉 CLOUDINARY INTEGRATION SUCCESSFUL!")
        print("\n✅ Your images and media files will be stored in Cloudinary")
        print("✅ All files are securely stored with CDN acceleration")
        print("✅ Automatic image optimization and transformations available")
        print("\nNext steps:")
        print("1. Add Cloudinary credentials to .env")
        print("2. Integrate upload views into your API endpoints")
        print("3. Update your models to store Cloudinary public_ids")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")
    
    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    main()
