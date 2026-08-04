from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import logging
import os
from .database import engine, Base, SessionLocal
from .routers import auth, reports
from .models import User
from .config import settings

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger(__name__)

# Programmatic table creation if they do not exist
Base.metadata.create_all(bind=engine)

# Auto seed default users for local development if empty
def seed_database():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            logger.info("Seeding database with default developer accounts...")
            seed_users = [
                User(
                    phone_number='+256700000001',
                    password_hash='$2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2', # Password123
                    role='farmer',
                    sub_county='Mukono Town'
                ),
                User(
                    phone_number='+256700000002',
                    password_hash='$2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2', # Password123
                    role='officer',
                    sub_county='Kampala Central'
                ),
                User(
                    phone_number='+256700000003',
                    password_hash='$2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2', # Password123
                    role='admin',
                    sub_county='Victoria University'
                )
            ]
            db.add_all(seed_users)
            db.commit()
            logger.info("Database seeding completed successfully.")
    except Exception as e:
        logger.exception("Error seeding database")
    finally:
        db.close()

seed_database()

app = FastAPI(
    title="Agriscan Backend Service",
    description="Geospatial Epidemiological Backend for Cassava and Banana Crop Disease Diagnostics in Uganda",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    try:
        from .database import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"database": "ok", "status": "ok"}
    except Exception as exc:
        return {"database": "error", "detail": str(exc), "status": "failed"}

@app.get("/health/config")
def health_config_check():
    model_dir = os.path.join(os.path.dirname(__file__), "model_assets")
    expected_models = [
        "mobilenetv2_crop_gatekeeper.tflite",
        "agriscan_model.tflite",
        "maize_disease_expert.tflite",
        "banana_disease_expert.tflite",
        "bean_disease_expert.tflite",
        "cassava_disease_expert.tflite",
        "coffe_model/coffee_model.tflite",
        "groundnuts_disease_expert.tflite",
        "potato_disease_expert.tflite",
        "tomato_disease_expert.tflite",
    ]
    return {
        "status": "ok",
        "sms": {
            "provider": settings.SMS_PROVIDER,
            "provider_ready": settings.sms_provider_ready(),
            "yoola_api_key_configured": bool(settings.YOLLA_SMS_API_KEY),
        },
        "ai": {
            "gemini_api_key_configured": bool(settings.GEMINI_API_KEY),
            "plantid_api_key_configured": bool(settings.PLANTID_API_KEY),
            "plantnet_api_key_configured": bool(settings.PLANTNET_API_KEY),
        },
        "models": {
            "model_dir": model_dir,
            "model_dir_exists": os.path.isdir(model_dir),
            "files": {
                name: os.path.exists(os.path.join(model_dir, name))
                for name in expected_models
            },
        },
    }

# CORS configurations for local React Native testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development clients to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Routers
app.include_router(auth.router)
app.include_router(reports.router)

@app.on_event("startup")
def log_runtime_configuration():
    logger.info(
        "Runtime configuration sms_provider=%s sms_provider_ready=%s yoola_key_configured=%s gemini_key_configured=%s",
        settings.SMS_PROVIDER,
        settings.sms_provider_ready(),
        bool(settings.YOLLA_SMS_API_KEY),
        bool(settings.GEMINI_API_KEY),
    )

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Agriscan API Server",
        "documentation": "/docs"
    }
