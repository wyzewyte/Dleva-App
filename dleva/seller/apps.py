from django.apps import AppConfig


class SellerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'seller'
    
    def ready(self):
        """Register signals when app is ready"""
        import seller.signals
