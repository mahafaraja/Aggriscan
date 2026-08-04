import random
import logging
import re
import time
from typing import Optional
from ..config import settings
from .firebase_sms import get_firebase_sms_service

logger = logging.getLogger(__name__)

# Retry configuration
MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 15  # Wait 15 seconds between retries

DEMO_PHONE_NUMBER = "+256762000000"
DEMO_VERIFICATION_CODE = "123456"


def normalize_phone_number(phone_number: str) -> str:
    """Normalize common Uganda phone formats to E.164 for consistent auth."""
    if not phone_number:
        return ""

    digits = re.sub(r"\D", "", phone_number)
    if not digits:
        return phone_number.strip()

    if digits.startswith("256"):
        return f"+{digits}"
    if digits.startswith("0"):
        return f"+256{digits[1:]}"
    if digits.startswith("7"):
        return f"+256{digits}"
    return f"+{digits}"


def is_demo_phone_number(phone_number: str) -> bool:
    """Return True for the temporary demo authentication phone number."""
    return normalize_phone_number(phone_number) == DEMO_PHONE_NUMBER


class SMSService:
    def __init__(self):
        self.verification_codes = {}  # In-memory storage for demo (use Redis in production)

    @property
    def provider(self) -> str:
        return settings.SMS_PROVIDER
    
    def generate_verification_code(self, phone_number: str) -> str:
        """Generate a 6-digit verification code"""
        normalized_phone = normalize_phone_number(phone_number)
        code = DEMO_VERIFICATION_CODE if is_demo_phone_number(normalized_phone) else str(random.randint(100000, 999999))
        self.verification_codes[normalized_phone] = {
            'code': code,
            'expires_at': None  # Add expiration logic if needed
        }
        logger.info("Generated verification code for %s (%s)", phone_number, normalized_phone)
        return code
    
    def send_verification_code(self, phone_number: str, message: str, recaptcha_token: Optional[str] = None) -> bool:
        """Send SMS verification code based on configured provider with retry logic"""
        code = self.generate_verification_code(phone_number)
        provider = self.provider

        logger.info(
            "SMS send requested provider=%s recipient=%s provider_ready=%s",
            provider,
            normalize_phone_number(phone_number),
            settings.sms_provider_ready(),
        )
        
        if provider == "mock":
            # Mock provider for development - logs to console
            logger.info(f"[MOCK SMS] To: {phone_number}, Message: {message} {code}")
            print(f"[MOCK SMS] Verification code for {phone_number}: {code}")
            return True

        if not settings.sms_provider_ready():
            logger.error("SMS provider %s is selected but required credentials are missing", provider)
            raise Exception("SMS service configuration error. Please contact support if this persists.")
        
        # Retry logic for real SMS providers
        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(f"Attempting to send SMS to {phone_number} (attempt {attempt}/{MAX_RETRIES})")
                
                if provider == "africastalking":
                    result = self._send_africastalking(phone_number, f"{message} {code}")
                elif provider == "twilio":
                    result = self._send_twilio(phone_number, f"{message} {code}")
                elif provider == "firebase":
                    firebase_service = get_firebase_sms_service()
                    result = firebase_service.send_verification_code(phone_number, f"{message} {code}", recaptcha_token=recaptcha_token)
                elif provider == "yoola":
                    result = self._send_yoola(phone_number, f"{message} {code}")
                else:
                    logger.error(f"Unknown SMS provider: {provider}")
                    return False
                
                if result:
                    logger.info(f"SMS sent successfully to {phone_number} on attempt {attempt}")
                    return True
                
                last_error = "SMS service returned unsuccessful response"
                
            except Exception as e:
                last_error = str(e)
                logger.error(f"Attempt {attempt} failed for {phone_number}: {e}")
            
            # Wait before retry (except on last attempt)
            if attempt < MAX_RETRIES:
                logger.info(f"Waiting {RETRY_DELAY_SECONDS} seconds before retry...")
                time.sleep(RETRY_DELAY_SECONDS)
        
        # All retries failed
        error_message = self._get_user_friendly_error_message(last_error)
        logger.error(f"Failed to send SMS to {phone_number} after {MAX_RETRIES} attempts: {last_error}")
        raise Exception(error_message)
    
    def _get_user_friendly_error_message(self, technical_error: Optional[str]) -> str:
        """Convert technical errors to user-friendly messages"""
        if not technical_error:
            return "Unable to send verification code. Please check your phone number and try again."
        
        error_lower = technical_error.lower()
        
        if "timeout" in error_lower or "connection" in error_lower:
            return "Network connection issue. Please check your internet and try again in a moment."
        
        elif "api key" in error_lower or "unauthorized" in error_lower or "401" in error_lower:
            return "SMS service configuration error. Please contact support if this persists."
        
        elif "404" in error_lower or "not found" in error_lower:
            return "SMS service temporarily unavailable. Please try again later."
        
        elif "500" in error_lower or "server error" in error_lower:
            return "SMS service is experiencing issues. Please try again in a few minutes."
        
        elif "invalid phone" in error_lower or "phone number" in error_lower:
            return "Invalid phone number format. Please enter a valid Ugandan phone number."
        
        else:
            return "Unable to send verification code. Please try again or contact support if the problem continues."
    
    def verify_code(self, phone_number: str, code: str) -> bool:
        """Verify the submitted code matches the stored one"""
        normalized_phone = normalize_phone_number(phone_number)

        # Demo/test credentials bypass
        if is_demo_phone_number(normalized_phone) and code == DEMO_VERIFICATION_CODE:
            logger.info(f"Demo credentials used for {phone_number} ({normalized_phone})")
            return True
        
        stored_data = self.verification_codes.get(normalized_phone)
        if not stored_data:
            return False
        
        is_valid = stored_data['code'] == code
        if is_valid:
            # Clean up after successful verification
            del self.verification_codes[normalized_phone]
            logger.info(f"Successfully verified code for {phone_number} ({normalized_phone})")
        
        return is_valid
    
    def _send_africastalking(self, phone_number: str, message: str) -> bool:
        """Send SMS via Africa's Talking"""
        try:
            import africastalking
            africastalking.initialize(
                username=settings.AFRICASTALKING_USERNAME,
                api_key=settings.AFRICASTALKING_API_KEY
            )
            sms = africastalking.SMS
            response = sms.send(message, [phone_number])
            logger.info(f"Africa's Talking response: {response}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS via Africa's Talking: {e}")
            return False
    
    def _send_twilio(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio"""
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            logger.info(f"Twilio message SID: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {e}")
            return False
    
    def _send_yoola(self, phone_number: str, message: str) -> bool:
        """Send SMS via YoolaSMS"""
        try:
            import requests
            
            if not settings.YOLLA_SMS_API_KEY:
                logger.error("YoolaSMS API key not configured")
                return False
            
            response = requests.post(
                f"{settings.YOLLA_SMS_API_BASE}/send_sms",
                headers={
                    'Content-Type': 'application/json',
                },
                json={
                    'api_key': settings.YOLLA_SMS_API_KEY,
                    'phone': phone_number,
                    'message': message,
                },
                timeout=30
            )
            
            if response.status_code == 200:
                # Check if the response indicates success
                try:
                    response_data = response.json()
                    logger.info(f"YoolaSMS response: {response_data}")
                    
                    # Check for success indicators in response
                    # Adjust these checks based on actual YoolaSMS API response format
                    if response_data.get('status') == 'success' or \
                       response_data.get('success') == True or \
                       response_data.get('code') == '200' or \
                       response_data.get('message', '').lower().find('success') != -1:
                        logger.info(f"YoolaSMS sent successfully to {phone_number}")
                        return True
                    else:
                        logger.error(f"YoolaSMS returned error in response: {response_data}")
                        return False
                except Exception as parse_error:
                    # If we can't parse JSON, assume success if status is 200
                    logger.warning(f"Could not parse YoolaSMS response: {parse_error}, assuming success")
                    logger.info(f"YoolaSMS sent successfully to {phone_number}")
                    return True
            else:
                logger.error(f"YoolaSMS error {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send SMS via YoolaSMS: {e}")
            return False

# Singleton instance
sms_service = SMSService()

def get_sms_service() -> SMSService:
    return sms_service
