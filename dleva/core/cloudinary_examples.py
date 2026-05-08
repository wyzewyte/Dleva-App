"""
Example: How to use Cloudinary Service in your views
Update this file based on your specific needs (seller images, menu photos, etc.)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.cloudinary_service import get_cloudinary_service
from datetime import datetime
import os


class UploadSellerImageView(APIView):
    """
    Example: Upload seller profile/business image to Cloudinary
    POST /api/seller/upload-image/
    Expected: multipart/form-data with 'image' field
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            if 'image' not in request.FILES:
                return Response(
                    {'error': 'No image provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            image_file = request.FILES['image']
            
            # Validate file size (e.g., max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            seller_id = request.user.id
            public_id = f"seller_{seller_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='seller_images',
                public_id=public_id
            )
            
            if result['success']:
                return Response(
                    {
                        'message': 'Image uploaded successfully',
                        'public_id': result['public_id'],
                        'url': result['url'],
                        'format': result['format'],
                        'size': result['size']
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': result.get('error')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UploadMenuImageView(APIView):
    """
    Example: Upload menu item image to Cloudinary
    POST /api/menu-item/upload-image/
    Expected: multipart/form-data with 'image' and 'menu_item_id' fields
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            if 'image' not in request.FILES:
                return Response(
                    {'error': 'No image provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            image_file = request.FILES['image']
            menu_item_id = request.data.get('menu_item_id')
            
            if not menu_item_id:
                return Response(
                    {'error': 'menu_item_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"menu_{menu_item_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='menu_images',
                public_id=public_id
            )
            
            if result['success']:
                return Response(
                    {
                        'message': 'Menu image uploaded successfully',
                        'public_id': result['public_id'],
                        'url': result['url'],
                        'format': result['format'],
                        'size': result['size']
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': result.get('error')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteImageView(APIView):
    """
    Example: Delete an image from Cloudinary
    DELETE /api/images/delete/
    Expected: JSON with 'public_id' field
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            public_id = request.data.get('public_id')
            
            if not public_id:
                return Response(
                    {'error': 'public_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cloudinary_service = get_cloudinary_service()
            success = cloudinary_service.delete_file(public_id)
            
            if success:
                return Response(
                    {'message': 'Image deleted successfully'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Failed to delete image'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetOptimizedImageView(APIView):
    """
    Example: Get an optimized image URL with specific dimensions
    GET /api/images/optimized/?public_id=seller_1_20250410_120000&width=300&height=300
    """
    
    def get(self, request):
        try:
            public_id = request.query_params.get('public_id')
            width = request.query_params.get('width', type=int)
            height = request.query_params.get('height', type=int)
            
            if not public_id:
                return Response(
                    {'error': 'public_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cloudinary_service = get_cloudinary_service()
            optimized_url = cloudinary_service.get_optimized_url(
                public_id,
                width=width,
                height=height
            )
            
            if optimized_url:
                return Response(
                    {
                        'public_id': public_id,
                        'width': width,
                        'height': height,
                        'url': optimized_url
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Failed to generate optimized URL'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# ALTERNATIVE: Store Cloudinary IDs in your Django models
# ============================================================================

# Example for updating a Seller model with Cloudinary image:
# 
# from django.db import models
# 
# class Seller(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     cloudinary_image_id = models.CharField(max_length=500, null=True, blank=True)
#     cloudinary_image_url = models.URLField(null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True)
#
# # In your view:
# seller = Seller.objects.get(user=request.user)
# seller.cloudinary_image_id = result['public_id']
# seller.cloudinary_image_url = result['url']
# seller.save()
#
# # Get optimized image in template:
# {{ seller.get_optimized_image_url|500|500 }}
