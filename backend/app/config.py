import os
from dotenv import load_dotenv

# Load variables from .env file if it exists
load_dotenv()

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
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "mock")  # Options: mock, africastalking, twilio
    AFRICASTALKING_API_KEY: str = os.getenv("AFRICASTALKING_API_KEY", "")
    AFRICASTALKING_USERNAME: str = os.getenv("AFRICASTALKING_USERNAME", "")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")

settings = Settings()
