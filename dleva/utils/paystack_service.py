"""
Paystack Payment Gateway Integration Service
Handles all communications with Paystack API for payment processing
"""

import requests
from decimal import Decimal
from decouple import config
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class PaystackService:
    """Service for integrating with Paystack payment gateway"""
    
    # ✅ GET API KEYS FROM ENVIRONMENT
    SECRET_KEY = config('PAYSTACK_SECRET_KEY')
    PUBLIC_KEY = config('PAYSTACK_PUBLIC_KEY')
    API_URL = config('PAYSTACK_API_URL', default='https://api.paystack.co')
    
    # ✅ CALLBACK URL - CHANGE THIS TO YOUR DEPLOYED URL
    CALLBACK_URL = config('PAYSTACK_CALLBACK_URL', default='http://localhost:5173/payment/callback')
    
    @classmethod
    def initialize_payment(cls, email, amount_kobo, reference, metadata=None, callback_url=None):
        """
        Initialize payment with Paystack
        
        Args:
            email (str): Customer email
            amount_kobo (int): Amount in kobo (NGN * 100)
            reference (str): Unique reference for this transaction
            metadata (dict): Optional metadata to attach to transaction
            callback_url (str): Optional custom callback URL (defaults to config)
            
        Returns:
            dict: Response from Paystack API with authorization_url
        """
        url = f"{cls.API_URL}/transaction/initialize"
        
        headers = {
            "Authorization": f"Bearer {cls.SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        # Use provided callback URL or default from config
        callback_url = callback_url or cls.CALLBACK_URL
        
        payload = {
            "email": email,
            "amount": int(amount_kobo),  # ✅ ENSURE IT'S AN INT
            "reference": reference,
            "metadata": metadata or {},
            "redirect_url": callback_url,  # ✅ PAYSTACK WILL REDIRECT HERE
        }
        
        logger.info(f"🔄 Sending to Paystack: email={email}, amount={int(amount_kobo)}kobo, reference={reference}")
        logger.info(f"🔑 URL: {url}")
        logger.info(f"📋 Payload: {payload}")
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            # ✅ LOG THE RESPONSE FIRST
            logger.info(f"📥 Paystack Response: status={response.status_code}")
            logger.info(f"📥 Response Text: {response.text}")
            
            data = response.json()
            logger.info(f"📥 Paystack Response Data: {data}")
            
            # ✅ Check for HTTP errors
            if response.status_code != 200:
                logger.error(f"❌ Paystack returned HTTP {response.status_code}")
                error_msg = data.get('message', f'HTTP {response.status_code} Error')
                return {
                    'success': False,
                    'error': error_msg
                }
            
            if data.get('status'):
                logger.info(f"✅ Paystack payment initialized: {reference}")
                response_data = data.get('data', {})
                return {
                    'success': True,
                    'authorization_url': response_data.get('authorization_url'),
                    'access_code': response_data.get('access_code'),
                    'reference': response_data.get('reference', reference),
                    'amount': response_data.get('amount', int(amount_kobo)),
                }
            else:
                error_msg = data.get('message', 'Payment initialization failed')
                logger.error(f"❌ Paystack initialization failed: {error_msg}")
                logger.error(f"   Full response: {data}")
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except requests.exceptions.HTTPError as e:
            logger.error(f"❌ Paystack HTTP Error: {e.response.status_code}")
            logger.error(f"   Response text: {e.response.text}")
            try:
                error_data = e.response.json()
                logger.error(f"   Error response: {error_data}")
                error_msg = error_data.get('message', str(e))
            except:
                error_msg = str(e)
            return {
                'success': False,
                'error': error_msg
            }
                
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Connection Error: {str(e)}")
            return {
                'success': False,
                'error': f'Cannot reach payment gateway. Please check your internet connection.'
            }
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ Paystack API Timeout")
            return {
                'success': False,
                'error': f'Payment gateway timeout. Please try again.'
            }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Paystack API error: {str(e)}")
            return {
                'success': False,
                'error': f'Payment gateway error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}")
            logger.error(f"   Error type: {type(e)}")
            import traceback
            logger.error(f"   Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }
    
    @classmethod
    def verify_payment(cls, reference):
        """
        Verify payment status with Paystack
        
        Args:
            reference (str): Payment reference to verify
            
        Returns:
            dict: Payment status and details
        """
        url = f"{cls.API_URL}/transaction/verify/{reference}"
        
        headers = {
            "Authorization": f"Bearer {cls.SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status'):
                transaction = data['data']
                
                # ✅ VERIFY PAYMENT STATUS
                if transaction.get('status') == 'success':
                    logger.info(f"✅ Payment verified successful: {reference}")
                    return {
                        'success': True,
                        'verified': True,
                        'status': 'completed',
                        'reference': transaction.get('reference'),
                        'amount': transaction.get('amount'),
                        'currency': transaction.get('currency'),
                        'paid_at': transaction.get('paid_at'),
                        'customer_code': transaction.get('customer', {}).get('customer_code'),
                    }
                else:
                    logger.warning(f"⚠️ Payment not successful: {reference} - Status: {transaction.get('status')}")
                    return {
                        'success': True,
                        'verified': False,
                        'status': transaction.get('status'),
                        'reference': reference,
                    }
            else:
                logger.error(f"❌ Paystack verification failed: {data.get('message')}")
                return {
                    'success': False,
                    'verified': False,
                    'error': data.get('message', 'Payment verification failed')
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Paystack verification API error: {str(e)}")
            return {
                'success': False,
                'verified': False,
                'error': f'Payment gateway error: {str(e)}'
            }
    
    @classmethod
    def get_payment_method_options(cls):
        """Get available payment methods for frontend"""
        return {
            'card': {
                'label': 'Debit/Credit Card',
                'icon': 'card',
                'description': 'Pay with your card'
            },
            'bank_transfer': {
                'label': 'Bank Transfer',
                'icon': 'bank',
                'description': 'Transfer from your bank account'
            },
            'ussd': {
                'label': 'USSD',
                'icon': 'phone',
                'description': 'Pay via USSD code'
            },
            'mobile_money': {
                'label': 'Mobile Money',
                'icon': 'mobile',
                'description': 'Pay with mobile money'
            }
        }


def convert_to_kobo(amount_naira):
    """Convert NGN amount to kobo (multiply by 100)"""
    logger.info(f"🔄 Converting to kobo: input={amount_naira}, type={type(amount_naira)}")
    
    if amount_naira is None:
        logger.error(f"❌ Amount is None!")
        raise ValueError("Amount cannot be None")
    
    try:
        if isinstance(amount_naira, str):
            amount_naira = Decimal(amount_naira)
        elif isinstance(amount_naira, int):
            amount_naira = Decimal(str(amount_naira))
        elif isinstance(amount_naira, float):
            amount_naira = Decimal(str(amount_naira))
        elif not isinstance(amount_naira, Decimal):
            logger.error(f"❌ Unexpected amount type: {type(amount_naira)}")
            raise TypeError(f"Amount must be int, float, Decimal, or string, got {type(amount_naira)}")
        
        kobo = int(amount_naira * 100)
        logger.info(f"✅ Converted: {amount_naira} NGN = {kobo} kobo")
        return kobo
    except Exception as e:
        logger.error(f"❌ Error in convert_to_kobo: {str(e)}")
        raise


def convert_to_naira(amount_kobo):
    """Convert kobo to NGN (divide by 100)"""
    if isinstance(amount_kobo, str):
        amount_kobo = Decimal(amount_kobo)
    elif isinstance(amount_kobo, int):
        amount_kobo = Decimal(str(amount_kobo))
    
    return amount_kobo / 100
