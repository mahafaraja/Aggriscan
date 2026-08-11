import os
from dotenv import load_dotenv

# Load variables from .env file if it exists. On Render, dashboard env vars
# still win over .env values because python-dotenv does not override by default.
load_dotenv()


def _env_str(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _env_sms_provider() -> str:
    return _env_str("SMS_PROVIDER", "yoola").lower()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgrespassword@localhost:5432/agriscan"
    )
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "super-secret-key-for-agriscan-vectoria-university-bcs-project-2026"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # SMS Configuration
    SMS_PROVIDER: str = _env_sms_provider()  # Options: mock, africastalking, twilio, firebase, yoola
    AFRICASTALKING_API_KEY: str = _env_str("AFRICASTALKING_API_KEY")
    AFRICASTALKING_USERNAME: str = _env_str("AFRICASTALKING_USERNAME")
    TWILIO_ACCOUNT_SID: str = _env_str("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = _env_str("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: str = _env_str("TWILIO_PHONE_NUMBER")
    FIREBASE_CREDENTIALS: str = _env_str("FIREBASE_CREDENTIALS", "services/config/firebase_sms.json")
    FIREBASE_WEB_API_KEY: str = _env_str("FIREBASE_WEB_API_KEY")
    YOLLA_SMS_API_KEY: str = _env_str("YOLLA_SMS_API_KEY")
    YOLLA_SMS_API_BASE: str = _env_str("YOLLA_SMS_API_BASE", "https://yoolasms.com/api/v1").rstrip("/")
    GEMINI_API_KEY: str = _env_str("GEMINI_API_KEY")
    PLANTID_API_KEY: str = _env_str("PLANTID_API_KEY")
    PLANTNET_API_KEY: str = _env_str("PLANTNET_API_KEY")

    # Crop.health (Kindwise) — disease/health identification provider
    CROP_HEALTH_API_KEY: str = _env_str("CROP_HEALTH_API_KEY")
    CROP_HEALTH_API_URL: str = _env_str(
        "CROP_HEALTH_API_URL", "https://crop.kindwise.com/api/v1"
    ).rstrip("/")

    # Confidence thresholds (configurable — calibrate with AgriScan validation data)
    PLANTNET_MIN_CONFIDENCE: float = float(_env_str("PLANTNET_MIN_CONFIDENCE", "0.45"))
    CROP_HEALTH_MIN_CONFIDENCE: float = float(_env_str("CROP_HEALTH_MIN_CONFIDENCE", "0.60"))
    LOCAL_MODEL_MIN_CONFIDENCE: float = float(_env_str("LOCAL_MODEL_MIN_CONFIDENCE", "0.45"))

    def crop_health_provider_ready(self) -> bool:
        return bool(self.CROP_HEALTH_API_KEY) and self.CROP_HEALTH_API_KEY != "your_crop_health_api_key_here"

    def sms_provider_ready(self) -> bool:
        if self.SMS_PROVIDER == "yoola":
            return bool(self.YOLLA_SMS_API_KEY)
        if self.SMS_PROVIDER == "mock":
            return True
        if self.SMS_PROVIDER == "africastalking":
            return bool(self.AFRICASTALKING_API_KEY and self.AFRICASTALKING_USERNAME)
        if self.SMS_PROVIDER == "twilio":
            return bool(self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN and self.TWILIO_PHONE_NUMBER)
        if self.SMS_PROVIDER == "firebase":
            return bool(self.FIREBASE_WEB_API_KEY)
        return False

settings = Settings()
