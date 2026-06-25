from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

# User Schemas
class UserBase(BaseModel):
    phone_number: str = Field(..., description="User mobile number with country code")
    role: str = Field(..., description="Role: 'farmer', 'officer', or 'admin'")
    sub_county: str = Field(..., description="Sub-county location in Uganda")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Cleartext password")

class UserOut(UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Auth schemas
class UserLogin(BaseModel):
    phone_number: str
    password: str

class SMSSendRequest(BaseModel):
    phone_number: str

class SMSVerifyRequest(BaseModel):
    phone_number: str
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone_number: Optional[str] = None
    role: Optional[str] = None

# Report Schemas
class ReportCreate(BaseModel):
    crop_type: str = Field(..., pattern="^(Cassava|Banana)$")
    disease_label: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    severity: str = Field(..., pattern="^(Low|Medium|High)$")
    offline_created_at: datetime
    image_url: Optional[str] = None

class ReportOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    crop_type: str
    disease_label: str
    confidence_score: float
    latitude: float
    longitude: float
    severity: str
    image_url: Optional[str] = None
    offline_created_at: datetime
    server_received_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Outbreak Alert / Summary Schemas
class OutbreakHotspot(BaseModel):
    latitude: float
    longitude: float
    outbreak_count: int
    radius_meters: float
    crop_type: str
    disease_label: str
