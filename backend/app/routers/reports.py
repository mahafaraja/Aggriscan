from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid
from ..database import get_db
from .. import schemas, crud, auth, models
from ..services.inference import get_inference_service

router = APIRouter(prefix="/api/v1/reports", tags=["Reports & Geospatial Mapping"])

@router.post("/diagnose")
def diagnose_crop_image(file: UploadFile = File(...)):
    """
    Accepts an uploaded crop image, runs MobileNetV3 classification,
    and returns crop type, disease label, confidence score, and severity.
    This endpoint is public.
    """
    # Verify file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File uploaded is not a valid image."
        )
        
    # Create a local temp directory within the workspace backend folder
    current_dir = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.join(os.path.dirname(current_dir), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Generate unique temp filename
    temp_file_path = os.path.join(temp_dir, f"temp_{uuid.uuid4().hex}_{file.filename}")
    
    try:
        # Save file locally
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run inference
        service = get_inference_service()
        prediction = service.predict_crop(temp_file_path)
        
        return prediction
    except Exception as e:
        print(f"Error running inference: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference engine failure: {str(e)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.post("/sync", response_model=List[schemas.ReportOut], status_code=status.HTTP_201_CREATED)
def sync_reports(
    reports_in: List[schemas.ReportCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Ingests batch of diagnostic reports synced from the offline mobile application storage.
    """
    created_reports = []
    for report_data in reports_in:
        db_report = crud.create_report(db=db, report_in=report_data, user_id=current_user.id)
        created_reports.append(crud._format_report_out(db_report))
    return created_reports

@router.get("/nearby", response_model=List[schemas.ReportOut])
def get_nearby_reports(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_meters: float = Query(5000.0, gt=0.0, description="Radius limit in meters"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Queries database for disease occurrence reports located within a specific proximity radius.
    """
    db_reports = crud.get_reports_in_radius(
        db=db, latitude=latitude, longitude=longitude, radius_meters=radius_meters
    )
    return [crud._format_report_out(r) for r in db_reports]

@router.get("/hotspots", response_model=List[schemas.OutbreakHotspot])
def get_outbreak_hotspots(
    radius_meters: float = Query(2000.0, gt=0.0, description="Outbreak search radius"),
    threshold_count: int = Query(5, gt=1, description="Minimum adjacent outbreaks to declare cluster"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["officer", "admin"]))
):
    """
    Finds clustered outbreaks (Hotspots). restricted to agricultural officers and administrators.
    """
    return crud.detect_outbreak_hotspots(
        db=db, radius_meters=radius_meters, threshold_count=threshold_count
    )

