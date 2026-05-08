"""
Cloudinary uploads views for sellers, restaurants, menu items, and buyers
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.cloudinary_service import get_cloudinary_service
from seller.models import SellerProfile, Restaurant, MenuItem
from buyer.models import BuyerProfile
import os
from datetime import datetime


class UploadSellerProfileImageView(APIView):
    """
    Upload seller profile image to Cloudinary
    POST /api/seller/upload-profile-image/
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
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get seller profile
            try:
                seller_profile = SellerProfile.objects.get(user=request.user)
            except SellerProfile.DoesNotExist:
                return Response(
                    {'error': 'Seller profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"seller_profile_{request.user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='seller_images',
                public_id=public_id
            )
            
            if result['success']:
                # Update seller profile
                seller_profile.cloudinary_image_id = result['public_id']
                seller_profile.cloudinary_image_url = result['url']
                seller_profile.save()
                
                return Response(
                    {
                        'message': 'Profile image uploaded successfully',
                        'public_id': result['public_id'],
                        'url': result['url'],
                        'size': result['size']
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': result.get('error', 'Upload failed')},
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
    POST /api/restaurant/upload-image/
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
            
            # Validate file size
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get seller profile and restaurant
            try:
                seller_profile = SellerProfile.objects.get(user=request.user)
                restaurant = Restaurant.objects.get(seller=seller_profile)
            except (SellerProfile.DoesNotExist, Restaurant.DoesNotExist):
                return Response(
                    {'error': 'Restaurant not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"restaurant_{restaurant.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='restaurant_images',
                public_id=public_id
            )
            
            if result['success']:
                # Update restaurant
                restaurant.cloudinary_image_id = result['public_id']
                restaurant.cloudinary_image_url = result['url']
                restaurant.save()
                
                return Response(
                    {
                        'message': 'Restaurant image uploaded successfully',
                        'public_id': result['public_id'],
                        'url': result['url'],
                        'size': result['size']
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': result.get('error', 'Upload failed')},
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
            
            # Validate file size
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get menu item
            try:
                menu_item = MenuItem.objects.get(id=menu_item_id)
                # Verify seller owns this menu item
                seller_profile = SellerProfile.objects.get(user=request.user)
                if menu_item.restaurant.seller != seller_profile:
                    return Response(
                        {'error': 'You do not have permission to upload image for this menu item'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except MenuItem.DoesNotExist:
                return Response(
                    {'error': 'Menu item not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except SellerProfile.DoesNotExist:
                return Response(
                    {'error': 'Seller profile not found'},
                    status=status.HTTP_404_NOT_FOUND
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
                # Update menu item
                menu_item.cloudinary_image_id = result['public_id']
                menu_item.cloudinary_image_url = result['url']
                menu_item.save()
                
                return Response(
                    {
                        'message': 'Menu item image uploaded successfully',
                        'public_id': result['public_id'],
                        'url': result['url'],
                        'size': result['size']
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': result.get('error', 'Upload failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UploadBuyerProfileImageView(APIView):
    """
    Upload buyer profile image to Cloudinary
    POST /api/buyer/upload-profile-image/
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
            
            # Validate file size
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'Image size exceeds 5MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get buyer profile
            try:
                buyer_profile = BuyerProfile.objects.get(user=request.user)
            except BuyerProfile.DoesNotExist:
                return Response(
                    {'error': 'Buyer profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Upload to Cloudinary
            cloudinary_service = get_cloudinary_service()
            public_id = f"buyer_profile_{request.user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            result = cloudinary_service.upload_image(
                image_file,
                folder='buyer_images',
                public_id=public_id
            )
            
            if result['success']:
                # Update buyer profile image (note: buyer model only has 'image' field, not Cloudinary fields yet)
                # But we can add them if needed
                buyer_profile.image = image_file  # Keep local backup if needed
                buyer_profile.save()
                
                return Response(
                    {
                        'message': 'Profile image uploaded successfully',
                        'public_id': result['public_id'],
                        'url': result['url'],
                        'size': result['size']
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': result.get('error', 'Upload failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteImageView(APIView):
    """
    Delete an image from Cloudinary
    DELETE /api/images/delete/
    Expected: JSON with 'public_id' and 'image_type' fields
    image_type: 'seller_profile', 'restaurant', 'menu_item', 'buyer_profile'
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            public_id = request.data.get('public_id')
            image_type = request.data.get('image_type', 'menu_item')
            
            if not public_id:
                return Response(
                    {'error': 'public_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cloudinary_service = get_cloudinary_service()
            success = cloudinary_service.delete_file(public_id)
            
            if success:
                return Response(
                    {'message': f'{image_type.replace("_", " ").title()} deleted successfully'},
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
