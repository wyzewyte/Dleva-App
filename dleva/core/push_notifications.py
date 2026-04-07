import json
import logging
import tempfile
from pathlib import Path

from decouple import config
from django.conf import settings


logger = logging.getLogger(__name__)


class PushNotificationClient:
    """Shared Firebase Cloud Messaging helper for all app roles."""

    @staticmethod
    def _get_service_account_credentials():
        """
        Get Firebase service account credentials from environment.
        Supports two methods:
        1. FIREBASE_SERVICE_ACCOUNT_PATH: Path to service account JSON file
        2. FIREBASE_SERVICE_ACCOUNT_JSON: JSON content as string (preferred for cloud)
        """
        # Method 1: Check for JSON content in environment variable (cloud-friendly)
        json_content = config('FIREBASE_SERVICE_ACCOUNT_JSON', default='')
        if json_content:
            try:
                credentials_dict = json.loads(json_content)
                return credentials_dict, 'from_env_variable'
            except json.JSONDecodeError:
                logger.error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON')
                return None, None

        # Method 2: Check for file path
        service_account_path = config('FIREBASE_SERVICE_ACCOUNT_PATH', default='')
        if service_account_path:
            path = Path(service_account_path)
            if path.exists():
                try:
                    with open(path, 'r') as f:
                        credentials_dict = json.load(f)
                    return credentials_dict, 'from_file_path'
                except (json.JSONDecodeError, IOError) as exc:
                    logger.error('Failed to read Firebase credentials from %s: %s', path, exc)
                    return None, None
            else:
                logger.error('Firebase service account file not found at: %s', path)
                return None, None

        # Fallback: Local development (only if file exists)
        local_path = Path(settings.BASE_DIR) / 'serviceAccountKey.json'
        if local_path.exists():
            try:
                with open(local_path, 'r') as f:
                    credentials_dict = json.load(f)
                return credentials_dict, 'from_local_fallback'
            except (json.JSONDecodeError, IOError) as exc:
                logger.error('Failed to read Firebase credentials from local path: %s', exc)
                return None, None

        # No credentials found
        logger.error(
            'Firebase credentials not configured. Set either:\n'
            '  - FIREBASE_SERVICE_ACCOUNT_JSON: Full JSON content as string (recommended)\n'
            '  - FIREBASE_SERVICE_ACCOUNT_PATH: Path to service account JSON file\n'
            '  - Local: serviceAccountKey.json in project root (development only)'
        )
        return None, None

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

        credentials_dict, source = cls._get_service_account_credentials()
        if not credentials_dict:
            return None

        try:
            cred = credentials.Certificate(credentials_dict)
            firebase_admin.initialize_app(cred)
            logger.info('Firebase initialized successfully (source: %s)', source)
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
