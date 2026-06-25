import random
import logging
from typing import Optional
from ..config import settings

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.provider = settings.SMS_PROVIDER
        self.verification_codes = {}  # In-memory storage for demo (use Redis in production)
    
    def generate_verification_code(self, phone_number: str) -> str:
        """Generate a 6-digit verification code"""
        code = str(random.randint(100000, 999999))
        self.verification_codes[phone_number] = {
            'code': code,
            'expires_at': None  # Add expiration logic if needed
        }
        logger.info(f"Generated verification code for {phone_number}: {code}")
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
        # Demo/test credentials bypass
        if phone_number == "+256762000000" and code == "123456":
            logger.info(f"Demo credentials used for {phone_number}")
            return True
        
        stored_data = self.verification_codes.get(phone_number)
        if not stored_data:
            return False
        
        is_valid = stored_data['code'] == code
        if is_valid:
            # Clean up after successful verification
            del self.verification_codes[phone_number]
            logger.info(f"Successfully verified code for {phone_number}")
        
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
