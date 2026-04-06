import logging
from pathlib import Path

from decouple import config
from django.conf import settings


logger = logging.getLogger(__name__)


class PushNotificationClient:
    """Shared Firebase Cloud Messaging helper for all app roles."""

    @staticmethod
    def _service_account_path():
        configured_path = config('FIREBASE_SERVICE_ACCOUNT_PATH', default='')
        if configured_path:
            return Path(configured_path)
        return Path(settings.BASE_DIR) / 'serviceAccountKey.json'

    @classmethod
    def _initialize_firebase(cls):
        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError:
            logger.warning('firebase-admin not installed. Install with: pip install firebase-admin')
            return None

        if firebase_admin._apps:
            return firebase_admin

        service_account_path = cls._service_account_path()
        if not service_account_path.exists():
            logger.warning('Firebase service account key not found at %s', service_account_path)
            return None

        try:
            firebase_admin.initialize_app(credentials.Certificate(str(service_account_path)))
            return firebase_admin
        except Exception as exc:
            logger.error('Failed to initialize Firebase Admin SDK: %s', exc)
            return None

    @classmethod
    def send(cls, *, token, title, body, data=None, sound=False):
        """Send a push notification via Firebase Cloud Messaging."""
        if not token:
            return False

        firebase_admin = cls._initialize_firebase()
        if not firebase_admin:
            return False

        try:
            from firebase_admin import messaging

            payload_data = {
                key: '' if value is None else str(value)
                for key, value in (data or {}).items()
            }

            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=payload_data,
                token=token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default' if sound else None,
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default' if sound else None,
                            badge=1,
                            content_available=True,
                        )
                    )
                ),
            )

            response = messaging.send(message)
            logger.info('FCM push notification sent successfully. Response: %s', response)
            return True
        except Exception as exc:
            logger.error('FCM push notification failed: %s', exc)
            return False
