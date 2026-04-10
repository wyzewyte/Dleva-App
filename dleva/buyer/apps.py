from django.apps import AppConfig


class BuyerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'buyer'
    
    def ready(self):
        """Register signals when app is ready"""
        import buyer.signals  # noqa
