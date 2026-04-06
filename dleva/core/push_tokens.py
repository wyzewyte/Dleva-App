from django.utils import timezone


def register_push_token(profile, token):
    """Persist an FCM token on a profile model that supports push notifications."""
    if not hasattr(profile, 'fcm_token') or not hasattr(profile, 'fcm_token_updated_at'):
        raise AttributeError('Profile does not support push notification tokens')

    profile.fcm_token = token
    profile.fcm_token_updated_at = timezone.now()
    profile.save(update_fields=['fcm_token', 'fcm_token_updated_at'])
    return profile


def unregister_push_token(profile, token=None):
    """Clear an FCM token from a profile model if present."""
    if not hasattr(profile, 'fcm_token') or not hasattr(profile, 'fcm_token_updated_at'):
        raise AttributeError('Profile does not support push notification tokens')

    if token and profile.fcm_token and profile.fcm_token != token:
        return profile

    profile.fcm_token = None
    profile.fcm_token_updated_at = timezone.now()
    profile.save(update_fields=['fcm_token', 'fcm_token_updated_at'])
    return profile
