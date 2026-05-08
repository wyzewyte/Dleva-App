"""
Cloudinary service for handling image and media uploads
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
from decouple import config


class CloudinaryService:
    """Handles all Cloudinary operations for image and media uploads"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CloudinaryService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._initialize_cloudinary()
    
    def _initialize_cloudinary(self):
        """Initialize Cloudinary with credentials"""
        cloudinary.config(
            cloud_name=config('CLOUDINARY_CLOUD_NAME'),
            api_key=config('CLOUDINARY_API_KEY'),
            api_secret=config('CLOUDINARY_API_SECRET')
        )
    
    def upload_image(self, file_obj, folder='', public_id=None):
        """
        Upload an image to Cloudinary
        
        Args:
            file_obj: File object (Django UploadedFile)
            folder: Folder path in Cloudinary (e.g., 'seller_images', 'menu_images')
            public_id: Optional custom public ID for the file
        
        Returns:
            dict: Upload response with URL and metadata
        """
        try:
            upload_options = {
                'folder': folder,
                'resource_type': 'auto',
                'quality': 'auto',
                'fetch_format': 'auto'
            }
            
            if public_id:
                upload_options['public_id'] = public_id
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(file_obj, **upload_options)
            
            return {
                'success': True,
                'public_id': result.get('public_id'),
                'url': result.get('secure_url'),
                'cloudinary_url': result.get('url'),
                'format': result.get('format'),
                'width': result.get('width'),
                'height': result.get('height'),
                'size': result.get('bytes'),
                'version': result.get('version')
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_url(self, public_id, transformations=None):
        """
        Get a Cloudinary URL for a file with optional transformations
        
        Args:
            public_id: Cloudinary public ID
            transformations: List of transformation dicts
        
        Returns:
            str: Secure URL
        """
        try:
            if transformations:
                url = cloudinary.CloudinaryResource(public_id).build_url(
                    secure=True,
                    transformation=transformations
                )
            else:
                url = cloudinary.CloudinaryResource(public_id).build_url(secure=True)
            
            return url
        except Exception as e:
            print(f"Error generating URL: {e}")
            return None
    
    def get_optimized_url(self, public_id, width=None, height=None, quality='auto'):
        """
        Get an optimized image URL with specified dimensions
        
        Args:
            public_id: Cloudinary public ID
            width: Optional width
            height: Optional height
            quality: Image quality (auto, 80, 90, etc.)
        
        Returns:
            str: Optimized secure URL
        """
        transformations = [{'quality': quality}]
        
        if width or height:
            transform = {}
            if width:
                transform['width'] = width
            if height:
                transform['height'] = height
            transform['crop'] = 'fill'
            transformations.append(transform)
        
        return self.get_url(public_id, transformations)
    
    def delete_file(self, public_id):
        """
        Delete a file from Cloudinary
        
        Args:
            public_id: Cloudinary public ID
        
        Returns:
            bool: True if deleted, False otherwise
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            print(f"Error deleting file from Cloudinary: {e}")
            return False
    
    def get_upload_stats(self):
        """
        Get upload statistics for your Cloudinary account
        
        Returns:
            dict: Upload stats
        """
        try:
            result = cloudinary.api.usage()
            return result
        except Exception as e:
            print(f"Error getting stats: {e}")
            return None
    
    def get_resources(self, folder=''):
        """
        List all resources in a folder
        
        Args:
            folder: Folder path (e.g., 'seller_images')
        
        Returns:
            list: List of resources
        """
        try:
            if folder:
                result = cloudinary.api.resources(prefix=folder)
            else:
                result = cloudinary.api.resources()
            
            return result.get('resources', [])
        except Exception as e:
            print(f"Error listing resources: {e}")
            return []


# Singleton instance
def get_cloudinary_service():
    """Get Cloudinary Service instance"""
    return CloudinaryService()
