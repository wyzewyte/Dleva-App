"""
Twilio SMS Service for OTP and Notification Delivery
Handles SMS sending for phone verification and OTP delivery
"""

from twilio.rest import Client
from decouple import config
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class TwilioService:
    """Service for sending SMS via Twilio"""
    
    # ✅ GET CREDENTIALS FROM ENVIRONMENT
    ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default=None)
    AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default=None)
    SENDER_PHONE = config('TWILIO_SENDER_PHONE', default=None)
    
    # Initialize Twilio client
    _client = None
    
    @classmethod
    def _get_client(cls):
        """Get or initialize Twilio client"""
        if cls._client is None:
            if not all([cls.ACCOUNT_SID, cls.AUTH_TOKEN]):
                logger.error("❌ Twilio credentials not configured in environment variables")
                return None
            cls._client = Client(cls.ACCOUNT_SID, cls.AUTH_TOKEN)
        return cls._client
    
    @classmethod
    def is_configured(cls):
        """Check if Twilio is properly configured"""
        return all([cls.ACCOUNT_SID, cls.AUTH_TOKEN, cls.SENDER_PHONE])
    
    @classmethod
    def send_otp_sms(cls, phone_number, otp_code, purpose='verification'):
        """
        Send OTP via SMS
        
        Args:
            phone_number (str): Recipient phone number (with country code)
            otp_code (str): OTP code to send
            purpose (str): 'verification' or 'login' or custom purpose
            
        Returns:
            dict: Response with success status and message
        """
        # 🔧 DEBUG MODE: Always print OTP to console for local development
        if settings.DEBUG:
            cls._print_otp_console(phone_number, otp_code, purpose)
        
        if not cls.is_configured():
            logger.warning("⚠️ Twilio not configured, OTP will be printed to console only")
            return {
                'success': False,
                'error': 'Twilio not configured',
                'message': 'SMS service not available. Check configuraton.'
            }
        
        try:
            client = cls._get_client()
            if not client:
                return {
                    'success': False,
                    'error': 'Failed to initialize Twilio client',
                    'message': 'Could not connect to SMS service'
                }
            
            # Format phone number - ensure it has country code
            phone = cls._format_phone_number(phone_number)
            
            # Craft message
            message_text = f"Your {purpose} code is: {otp_code}. Valid for 10 minutes. Do not share this code."
            
            # Send SMS
            message = client.messages.create(
                body=message_text,
                from_=cls.SENDER_PHONE,
                to=phone
            )
            
            logger.info(f"✅ OTP SMS sent successfully to {phone}")
            logger.info(f"   Message SID: {message.sid}")
            logger.info(f"   Status: {message.status}")
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status,
                'phone': phone,
                'message': f'OTP sent to {phone}'
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send OTP SMS: {str(e)}")
            logger.error(f"   Error type: {type(e).__name__}")
            
            # Note: OTP is already printed to console in DEBUG mode above
            logger.warning("⚠️ SMS delivery failed, OTP should be visible in console (DEBUG mode)")
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send OTP. Please try again.'
            }
    
    @classmethod
    def send_notification_sms(cls, phone_number, message_text):
        """
        Send general SMS notification
        
        Args:
            phone_number (str): Recipient phone number (with country code)
            message_text (str): Message to send
            
        Returns:
            dict: Response with success status and message
        """
        if not cls.is_configured():
            logger.warning("⚠️ Twilio not configured, SMS will be printed to console only")
            print(f"\n{'='*60}")
            print(f"📱 SMS NOTIFICATION (Test Mode)")
            print(f"To: {phone_number}")
            print(f"Message: {message_text}")
            print(f"{'='*60}\n")
            return {
                'success': False,
                'error': 'Twilio not configured',
                'message': 'SMS service not available.'
            }
        
        try:
            client = cls._get_client()
            if not client:
                return {
                    'success': False,
                    'error': 'Failed to initialize Twilio client',
                    'message': 'Could not connect to SMS service'
                }
            
            phone = cls._format_phone_number(phone_number)
            
            # Limit message to SMS length
            if len(message_text) > 160:
                message_text = message_text[:157] + "..."
            
            message = client.messages.create(
                body=message_text,
                from_=cls.SENDER_PHONE,
                to=phone
            )
            
            logger.info(f"✅ Notification SMS sent to {phone}")
            logger.info(f"   Message SID: {message.sid}")
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status,
                'message': f'Message sent to {phone}'
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send notification SMS: {str(e)}")
            
            # Fall back to console mode if network fails
            logger.warning("⚠️ Falling back to console mode (test mode)")
            print(f"\n{'='*60}")
            print(f"📱 SMS NOTIFICATION (Test Mode)")
            print(f"To: {phone_number}")
            print(f"Message: {message_text}")
            print(f"{'='*60}\n")
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send message. Please try again.'
            }
    
    @classmethod
    def send_rider_otp_sms(cls, phone_number, otp_code):
        """
        Send OTP SMS specifically for rider verification
        
        Args:
            phone_number (str): Rider's phone number
            otp_code (str): OTP code
            
        Returns:
            dict: Response with success status
        """
        return cls.send_otp_sms(
            phone_number=phone_number,
            otp_code=otp_code,
            purpose='registration'
        )
    
    @classmethod
    def send_order_update_sms(cls, phone_number, order_update):
        """
        Send order status update SMS to rider
        
        Args:
            phone_number (str): Rider's phone number
            order_update (str): Order status message
            
        Returns:
            dict: Response with success status
        """
        return cls.send_notification_sms(phone_number, order_update)
    
    @staticmethod
    def _format_phone_number(phone_number):
        """
        Format phone number to E.164 standard (+234XXXXXXXXXX)
        
        Args:
            phone_number (str): Phone number (various formats accepted)
            
        Returns:
            str: Formatted phone number in E.164 format
        """
        # Remove all non-digit characters
        cleaned = ''.join(filter(str.isdigit, phone_number))
        
        # Handle Nigerian numbers
        if cleaned.startswith('0') and len(cleaned) == 11:
            # 0XXXXXXXXXX -> +234XXXXXXXXXX
            cleaned = '234' + cleaned[1:]
        elif not cleaned.startswith('234') and len(cleaned) == 10:
            # XXXXXXXXXX -> +234XXXXXXXXXX
            cleaned = '234' + cleaned
        elif not cleaned.startswith('+'):
            # Ensure + prefix
            if not cleaned.startswith('234'):
                # Assume Nigerian if no country code
                if len(cleaned) == 10:
                    cleaned = '234' + cleaned
        
        # Add + prefix if not present
        if not cleaned.startswith('+'):
            cleaned = '+' + cleaned
        
        return cleaned
    
    @staticmethod
    def _print_otp_console(phone_number, otp_code, purpose='verification'):
        """Print OTP to console for testing when Twilio is not configured"""
        print(f"\n{'='*60}")
        print(f"📱 OTP CODE (Test Mode - Twilio Not Configured)")
        print(f"Purpose: {purpose.title()}")
        print(f"Phone: {phone_number}")
        print(f"OTP Code: {otp_code}")
        print(f"Expires in: 10 minutes")
        print(f"Valid for: 5 attempts")
        print(f"{'='*60}\n")
