from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# Setup SQLAlchemy connection engine
# Check if running async database driver, but since we are using standard psycopg2 we use standard create_engine
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency injection provider to create/close DB session per request context.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
