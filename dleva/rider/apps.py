from django.apps import AppConfig


class RiderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rider'

    def ready(self):
        import rider.signals
        import rider.phase4_signals  # Phase 4: Real-time tracking signals
