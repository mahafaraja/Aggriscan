import random
import logging
import re
from typing import Optional
from ..config import settings

logger = logging.getLogger(__name__)

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
        self.provider = settings.SMS_PROVIDER
        self.verification_codes = {}  # In-memory storage for demo (use Redis in production)
    
    def generate_verification_code(self, phone_number: str) -> str:
        """Generate a 6-digit verification code"""
        normalized_phone = normalize_phone_number(phone_number)
        code = DEMO_VERIFICATION_CODE if is_demo_phone_number(normalized_phone) else str(random.randint(100000, 999999))
        self.verification_codes[normalized_phone] = {
            'code': code,
            'expires_at': None  # Add expiration logic if needed
        }
        logger.info(f"Generated verification code for {phone_number} ({normalized_phone}): {code}")
        return code
    
    def send_verification_code(self, phone_number: str, message: str) -> bool:
        """Send SMS verification code based on configured provider"""
        code = self.generate_verification_code(phone_number)
        
        if self.provider == "mock":
            # Mock provider for development - logs to console
            logger.info(f"[MOCK SMS] To: {phone_number}, Message: {message} {code}")
            print(f"[MOCK SMS] Verification code for {phone_number}: {code}")
            return True
        
        elif self.provider == "africastalking":
            return self._send_africastalking(phone_number, f"{message} {code}")
        
        elif self.provider == "twilio":
            return self._send_twilio(phone_number, f"{message} {code}")
        
        else:
            logger.error(f"Unknown SMS provider: {self.provider}")
            return False
    
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

# Singleton instance
sms_service = SMSService()

def get_sms_service() -> SMSService:
    return sms_service
