from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from .. import schemas, crud, auth
from ..services.sms import get_sms_service, normalize_phone_number

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_phone(db, phone_number=user_in.phone_number)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile phone number is already registered"
        )
    return crud.create_user(db=db, user_in=user_in)

@router.post("/login", response_model=schemas.Token)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_phone(db, phone_number=login_data.phone_number)
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Issue JWT containing subject phone number and user permission role
    access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.phone_number, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/sms/send")
def send_sms_verification(request: schemas.SMSSendRequest):
    """
    Send SMS verification code to the provided phone number.
    This endpoint is public for demo purposes.
    """
    normalized_phone = normalize_phone_number(request.phone_number)
    sms_service = get_sms_service()
    success = sms_service.send_verification_code(
        phone_number=normalized_phone,
        message="Your Agriscan verification code is:"
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send SMS verification code"
        )
    
    return {"message": "Verification code sent successfully"}

@router.post("/sms/verify", response_model=schemas.Token)
def verify_sms_code(request: schemas.SMSVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify SMS code and issue JWT token if valid.
    Creates user if not exists (auto-registration).
    """
    normalized_phone = normalize_phone_number(request.phone_number)
    sms_service = get_sms_service()
    
    if not sms_service.verify_code(normalized_phone, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Check if user exists, create if not
    user = crud.get_user_by_phone(db, phone_number=normalized_phone)
    if not user:
        # Auto-register with default farmer role
        user_in = schemas.UserCreate(
            phone_number=normalized_phone,
            password="default_password",  # Will be changed on first login
            role="farmer",
            sub_county="Unknown"
        )
        user = crud.create_user(db=db, user_in=user_in)
    
    # Issue JWT token
    access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.phone_number, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
