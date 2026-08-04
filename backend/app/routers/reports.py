from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid
import logging
from datetime import datetime
from ..database import get_db
from .. import schemas, crud, auth, models
from ..services.inference import get_inference_service
from ..services.plant_identification import (
    get_image_validation_service,
    get_plant_identification_service,
    get_care_recommendation_service,
    get_pdf_report_generator
)

router = APIRouter(prefix="/api/v1/reports", tags=["Reports & Geospatial Mapping"])
logger = logging.getLogger(__name__)

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


@router.post("/analyze-plant")
def analyze_plant_image(file: UploadFile = File(...)):
    """
    Green-Sense Multi-Service Plant Analysis Pipeline
    1. Image Validation - Checks if image contains a plant
    2. Plant Identification - Identifies plant species with fallback services
    3. Care Recommendations - Generates care and treatment guides
    4. PDF Report - Creates professional report
    
    This endpoint is public and uses the Green-Sense architecture.
    """
    # Verify file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File uploaded is not a valid image."
        )
    
    # Create temp directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.join(os.path.dirname(current_dir), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Generate unique temp filename
    temp_file_path = os.path.join(temp_dir, f"temp_{uuid.uuid4().hex}_{file.filename}")
    
    try:
        # Save file locally
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        analysis_result = {
            "timestamp": datetime.now().isoformat(),
            "image_validated": False,
            "plant_identified": False,
            "care_recommendations_generated": False,
            "pdf_report_generated": False
        }
        
        # Step 1: Image Validation
        logger.info("Analyze plant step 1: validating image")
        validation_service = get_image_validation_service()
        validation_result = validation_service.validate_plant_image(temp_file_path)
        analysis_result["image_validation"] = validation_result
        analysis_result["image_validated"] = validation_result.get("is_plant", False)
        
        if not validation_result.get("is_plant", False) and not validation_result.get("error", False):
            analysis_result["error"] = "Image does not appear to contain a plant"
            analysis_result["suggestion"] = "Please upload a clear image of a plant leaf, flower, or stem"
            return analysis_result

        if validation_result.get("error", False):
            logger.warning("Image validation unavailable, continuing to identification: %s", validation_result.get("reason"))
        
        # Step 2: Plant Identification with Fallback
        logger.info("Analyze plant step 2: identifying plant")
        identification_service = get_plant_identification_service()
        identification_result = identification_service.identify_plant(temp_file_path)
        analysis_result["plant_identification"] = identification_result
        analysis_result["plant_identified"] = identification_result.get("success", False)
        
        if not identification_result.get("success"):
            analysis_result["error"] = "Could not identify plant species"
            analysis_result["details"] = identification_result.get("error", "Unknown error")
            return analysis_result
        
        # Step 3: Care Recommendations
        logger.info("Analyze plant step 3: generating care recommendations")
        care_service = get_care_recommendation_service()
        plant_data = identification_result.get("plant_data", {})
        
        # Generate care guide
        care_result = care_service.generate_care_guide(plant_data)
        analysis_result["care_recommendations"] = care_result
        analysis_result["care_recommendations_generated"] = care_result.get("success", False)
        
        # Generate treatment plan if disease is detected
        treatment_result = {"success": False, "note": "No disease detected or treatment not applicable"}
        
        # Step 4: PDF Report Generation
        logger.info("Analyze plant step 4: generating PDF report")
        pdf_service = get_pdf_report_generator()
        report_result = pdf_service.generate_report(analysis_result)
        analysis_result["pdf_report"] = report_result
        analysis_result["pdf_report_generated"] = report_result.get("success", False)
        
        # Add summary for frontend
        analysis_result["summary"] = {
            "plant_name": plant_data.get("plant_name", "Unknown"),
            "scientific_name": plant_data.get("scientific_name", "Unknown"),
            "confidence": plant_data.get("confidence", 0.0),
            "service_used": identification_result.get("service_used", "unknown"),
            "fallback_used": identification_result.get("fallback_used", False),
            "care_guide_available": care_result.get("success", False),
            "report_available": report_result.get("success", False)
        }
        
        return analysis_result
        
    except Exception as e:
        print(f"Error in plant analysis pipeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failure: {str(e)}"
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

