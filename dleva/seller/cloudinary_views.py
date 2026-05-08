"""
Seller Cloudinary Upload Views
Handles uploading seller profile, restaurant, and menu item images to Cloudinary
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.cloudinary_service import get_cloudinary_service
from datetime import datetime
import os

from seller.models import SellerProfile, Restaurant, MenuItem


class UploadSellerProfileImageView(APIView):
    """
    Upload seller profile image to Cloudinary
    POST /api/seller/upload-profile-image/
    Expected: multipart/form-data with 'image' field
    Returns: Cloudinary public_id and secure URL
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
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create seller profile
            seller_profile = request.user.seller_profile
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"seller_profile_{seller_profile.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='seller_profiles',
                public_id=public_id
            )
            
            if result['success']:
                # Save to database
                seller_profile.cloudinary_image_id = result['public_id']
                seller_profile.cloudinary_image_url = result['url']
                seller_profile.save()
                
                return Response(
                    {
                        'message': 'Seller profile image uploaded successfully',
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


class UploadRestaurantImageView(APIView):
    """
    Upload restaurant image to Cloudinary
    POST /api/seller/upload-restaurant-image/
    Expected: multipart/form-data with 'image' field
    Returns: Cloudinary public_id and secure URL
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
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get seller profile and restaurant
            seller_profile = request.user.seller_profile
            restaurant = seller_profile.restaurant
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"restaurant_{restaurant.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='restaurants',
                public_id=public_id
            )
            
            if result['success']:
                # Save to database
                restaurant.cloudinary_image_id = result['public_id']
                restaurant.cloudinary_image_url = result['url']
                restaurant.save()
                
                return Response(
                    {
                        'message': 'Restaurant image uploaded successfully',
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


class UploadMenuItemImageView(APIView):
    """
    Upload menu item image to Cloudinary
    POST /api/seller/menu/<menu_id>/upload-image/
    Expected: multipart/form-data with 'image' field
    Returns: Cloudinary public_id and secure URL
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, menu_id):
        try:
            if 'image' not in request.FILES:
                return Response(
                    {'error': 'No image provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            image_file = request.FILES['image']
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get menu item - verify it belongs to seller
            try:
                menu_item = MenuItem.objects.get(
                    id=menu_id,
                    restaurant__seller__user=request.user
                )
            except MenuItem.DoesNotExist:
                return Response(
                    {'error': 'Menu item not found or access denied'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"menu_{menu_item.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='menu_items',
                public_id=public_id
            )
            
            if result['success']:
                # Save to database
                menu_item.cloudinary_image_id = result['public_id']
                menu_item.cloudinary_image_url = result['url']
                menu_item.save()
                
                return Response(
                    {
                        'message': 'Menu item image uploaded successfully',
                        'menu_id': menu_id,
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


class DeleteSellerImageView(APIView):
    """
    Delete a seller image from Cloudinary
    DELETE /api/seller/delete-image/
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
    Get an optimized image URL with specific dimensions
    GET /api/seller/optimized-image/?public_id=seller_profile_1&width=300&height=300
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
