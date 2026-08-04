"""
Firebase Cloud Messaging SMS Service
Alternative SMS provider using Firebase for authentication
"""
import os
import logging
from typing import Optional
import requests
from ..config import settings

logger = logging.getLogger(__name__)

try:
    from firebase_admin import messaging, credentials
    from firebase_admin import initialize_app
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase Admin SDK not installed. Install with: pip install firebase-admin")


class FirebaseSMSService:
    """SMS service using Firebase Cloud Messaging"""
    
    def __init__(self):
        self.initialized = False
        if FIREBASE_AVAILABLE:
            try:
                # Initialize Firebase with service account key if present in repo
                # Prefer explicit certificate file bundled in repository for local dev
                current_dir = os.path.dirname(os.path.abspath(__file__))
                configured_path = settings.FIREBASE_CREDENTIALS or ""
                if configured_path:
                    candidate_paths = [
                        os.path.join(os.path.dirname(current_dir), configured_path),
                        os.path.join(os.path.dirname(os.path.dirname(current_dir)), configured_path),
                        configured_path,
                    ]
                    service_account_path = next((p for p in candidate_paths if os.path.exists(p)), None)
                else:
                    service_account_path = os.path.join(current_dir, "config", "firebase_sms.json")

                if service_account_path and os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    initialize_app(cred)
                    logger.info(f"Initialized Firebase Admin from {service_account_path}")
                else:
                    # Fall back to Application Default Credentials (requires env var GOOGLE_APPLICATION_CREDENTIALS or GCP metadata)
                    cred = credentials.ApplicationDefault()
                    initialize_app(cred)
                self.initialized = True
                logger.info("Firebase SMS service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {e}")
    
    def send_verification_code(self, phone_number: str, message: str, recaptcha_token: Optional[str] = None) -> bool:
        """
        Send SMS verification code via Firebase
        Note: Firebase doesn't directly send SMS, this would typically use:
        1. Firebase Authentication (phone auth)
        2. Third-party SMS service integrated with Firebase
        """
        if not self.initialized:
            logger.error("Firebase not initialized")
            return False

        # Firebase Admin SDK does not directly send SMS messages.
        # For a minimal integrated flow we: create or ensure a Firebase Auth user
        # for the phone number (so the project records it), then log the intent
        # to send an SMS. In production, configure Firebase Phone Auth or a
        # third-party SMS provider to actually deliver the code.
        try:
            from firebase_admin import auth as firebase_auth
            # If we have a Firebase Web API key and a recaptcha token, call the REST Identity Toolkit
            web_api_key = settings.FIREBASE_WEB_API_KEY
            if web_api_key and recaptcha_token:
                try:
                    url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key={web_api_key}"
                    payload = {
                        "phoneNumber": phone_number,
                        "recaptchaToken": recaptcha_token
                    }
                    resp = requests.post(url, json=payload, timeout=15)
                    if resp.status_code == 200:
                        logger.info(f"Identity Toolkit sent verification code to {phone_number}")
                        return True
                    else:
                        logger.error(f"Identity Toolkit error {resp.status_code}: {resp.text}")
                except Exception as e:
                    logger.error(f"Identity Toolkit request failed: {e}")

            # Create or update user with phone number in Firebase Auth as a fallback
            try:
                user = firebase_auth.get_user_by_phone_number(phone_number)
                logger.info(f"Firebase user exists for {phone_number}: {user.uid}")
            except Exception:
                user = firebase_auth.create_user(phone_number=phone_number)
                logger.info(f"Created Firebase user for {phone_number}: {user.uid}")

            logger.info(f"[FIREBASE SMS] Prepared verification for {phone_number}. Message: {message}")
            return True
        except Exception as e:
            logger.error(f"Firebase SMS flow error: {e}")
            return False
    
    def verify_code(self, phone_number: str, code: str) -> bool:
        """Verify SMS code - would integrate with Firebase Auth"""
        logger.warning("Firebase SMS verification requires Firebase Auth integration")
        return False


# Singleton instance
firebase_sms_service = FirebaseSMSService()

def get_firebase_sms_service() -> FirebaseSMSService:
    return firebase_sms_service