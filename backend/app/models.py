import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # 'farmer', 'officer', 'admin'
    sub_county = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # Relational link
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    crop_type = Column(String(50), nullable=False) # 'Cassava', 'Banana'
    disease_label = Column(String(100), nullable=False) # e.g. 'CMD_Infected', 'Healthy'
    confidence_score = Column(Numeric(5, 4), nullable=False)
    
    latitude = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)
    
    image_url = Column(String(512), nullable=True)
    severity = Column(String(50), nullable=False) # 'Low', 'Medium', 'High'
    offline_created_at = Column(DateTime(timezone=True), nullable=False)
    server_received_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # Relational link
    user = relationship("User", back_populates="reports")

