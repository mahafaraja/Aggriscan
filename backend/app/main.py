from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import auth, reports
from .models import User

# Programmatic table creation if they do not exist
Base.metadata.create_all(bind=engine)

# Auto seed default users for local development if empty
def seed_database():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Seeding database with default developer accounts...")
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
            print("Database seeding completed successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_database()

app = FastAPI(
    title="Agriscan Backend Service",
    description="Geospatial Epidemiological Backend for Cassava and Banana Crop Disease Diagnostics in Uganda",
    version="1.0.0"
)

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Agriscan API Server",
        "documentation": "/docs"
    }
