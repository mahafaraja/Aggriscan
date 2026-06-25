from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import math
from . import models, schemas, auth

# User CRUD
def get_user_by_phone(db: Session, phone_number: str):
    return db.query(models.User).filter(models.User.phone_number == phone_number).first()

def create_user(db: Session, user_in: schemas.UserCreate):
    hashed_pwd = auth.get_password_hash(user_in.password)
    db_user = models.User(
        phone_number=user_in.phone_number,
        password_hash=hashed_pwd,
        role=user_in.role,
        sub_county=user_in.sub_county
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Helper to format spatial data to lat/long schema
def _format_report_out(db_report: models.Report) -> schemas.ReportOut:
    return schemas.ReportOut(
        id=db_report.id,
        user_id=db_report.user_id,
        crop_type=db_report.crop_type,
        disease_label=db_report.disease_label,
        confidence_score=float(db_report.confidence_score),
        longitude=float(db_report.longitude),
        latitude=float(db_report.latitude),
        severity=db_report.severity,
        image_url=db_report.image_url,
        offline_created_at=db_report.offline_created_at,
        server_received_at=db_report.server_received_at
    )

# Report CRUD
def create_report(db: Session, report_in: schemas.ReportCreate, user_id: uuid.UUID) -> models.Report:
    db_report = models.Report(
        user_id=user_id,
        crop_type=report_in.crop_type,
        disease_label=report_in.disease_label,
        confidence_score=report_in.confidence_score,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        severity=report_in.severity,
        image_url=report_in.image_url,
        offline_created_at=report_in.offline_created_at
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_reports_in_radius(db: Session, latitude: float, longitude: float, radius_meters: float) -> list[models.Report]:
    """
    Retrieves all crop reports within a specific distance (meters) of a target coordinate.
    Uses a bounding box search first, and then refines using the Haversine distance formula in Python.
    """
    # 1 degree of latitude is approx 111,000 meters
    lat_delta = radius_meters / 111000.0
    # 1 degree of longitude is approx 111,000 * cos(latitude) meters
    lat_rad = math.radians(latitude)
    cos_lat = math.cos(lat_rad)
    if cos_lat > 0.001:
        lon_delta = radius_meters / (111000.0 * cos_lat)
    else:
        lon_delta = 180.0
        
    candidates = db.query(models.Report).filter(
        models.Report.latitude >= latitude - lat_delta,
        models.Report.latitude <= latitude + lat_delta,
        models.Report.longitude >= longitude - lon_delta,
        models.Report.longitude <= longitude + lon_delta
    ).all()
    
    # Filter by exact Haversine distance
    results = []
    for r in candidates:
        lat1, lon1 = math.radians(latitude), math.radians(longitude)
        lat2, lon2 = math.radians(float(r.latitude)), math.radians(float(r.longitude))
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        dist = 6371000.0 * c # Earth radius in meters
        if dist <= radius_meters:
            results.append(r)
            
    return results

def detect_outbreak_hotspots(db: Session, radius_meters: float = 2000.0, threshold_count: int = 5) -> list[schemas.OutbreakHotspot]:
    """
    Identifies disease clusters.
    Finds reports that have at least `threshold_count` neighboring cases of the same disease within `radius_meters`.
    """
    reports = db.query(models.Report).filter(models.Report.disease_label != "Healthy").all()
    output = []
    
    for r1 in reports:
        near_count = 0
        for r2 in reports:
            if r1.crop_type == r2.crop_type and r1.disease_label == r2.disease_label:
                lat1, lon1 = math.radians(float(r1.latitude)), math.radians(float(r1.longitude))
                lat2, lon2 = math.radians(float(r2.latitude)), math.radians(float(r2.longitude))
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                dist = 6371000.0 * c
                if dist <= radius_meters:
                    near_count += 1
                    
        if near_count >= threshold_count:
            # Check if coordinates are already in output to avoid duplicates
            already_in = False
            for h in output:
                if (abs(h.latitude - float(r1.latitude)) < 0.0001 and 
                    abs(h.longitude - float(r1.longitude)) < 0.0001 and 
                    h.crop_type == r1.crop_type and 
                    h.disease_label == r1.disease_label):
                    already_in = True
                    break
            if not already_in:
                output.append(
                    schemas.OutbreakHotspot(
                        latitude=float(r1.latitude),
                        longitude=float(r1.longitude),
                        outbreak_count=near_count,
                        radius_meters=radius_meters,
                        crop_type=r1.crop_type,
                        disease_label=r1.disease_label
                    )
                )
    return output

