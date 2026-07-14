"""
Green-Sense Multi-Service Plant Identification System
Implements the 5-step pipeline:
1. Image Validation
2. Primary Plant Identification (Gemini)
3. Fallback Identification (PlantID, PlantNet)
4. Care Recommendations
5. PDF Report Generation
"""
import os
import base64
import json
import requests
from typing import Dict, Any, Optional, List
from PIL import Image
import io
from datetime import datetime
from .inference import get_inference_service


class ImageValidationService:
    """Validates if an image contains a plant"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}" if gemini_api_key else None
        self.enabled = bool(gemini_api_key)
    
    def validate_plant_image(self, image_path: str) -> Dict[str, Any]:
        """
        Validates if the uploaded image contains a plant.
        Returns validation result with confidence score.
        """
        try:
            # If Gemini key not configured, skip primary validation
            if not self.enabled or not self.gemini_url:
                return {
                    "is_plant": False,
                    "confidence": 0.0,
                    "reason": "Gemini API key not configured",
                    "error": True
                }

            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            # Prepare prompt for image validation
            prompt = """
            Analyze this image and determine if it contains a plant (leaf, flower, stem, or any plant part).
            Respond with ONLY a JSON object in this exact format:
            {
                "is_plant": true/false,
                "confidence": 0.0-1.0,
                "reason": "brief explanation"
            }
            """
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }]
            }
            
            response = requests.post(
                self.gemini_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                return {
                    "is_plant": False,
                    "confidence": 0.0,
                    "reason": f"API error: {response.status_code}",
                    "error": True
                }
            
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Extract JSON from response
            try:
                # Try to parse JSON from the response
                json_start = text_response.find('{')
                json_end = text_response.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    validation_data = json.loads(text_response[json_start:json_end])
                    return {
                        "is_plant": validation_data.get('is_plant', False),
                        "confidence": validation_data.get('confidence', 0.0),
                        "reason": validation_data.get('reason', ''),
                        "error": False
                    }
            except:
                pass
            
            return {
                "is_plant": False,
                "confidence": 0.0,
                "reason": "Could not parse validation response",
                "error": True
            }
            
        except Exception as e:
            return {
                "is_plant": False,
                "confidence": 0.0,
                "reason": str(e),
                "error": True
            }


class PlantIdentificationService:
    """Multi-service plant identification with fallback support"""
    
    def __init__(self, gemini_api_key: str, plantid_api_key: Optional[str] = None, 
                 plantnet_api_key: Optional[str] = None):
        self.gemini_api_key = gemini_api_key
        self.plantid_api_key = plantid_api_key
        self.plantnet_api_key = plantnet_api_key
        
        self.gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}"
        self.plantid_url = "https://api.plant.id/identify"
        self.plantnet_url = "https://my-api.plantnet.org/v2/identify/all"
    
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    def identify_with_gemini(self, image_path: str) -> Dict[str, Any]:
        """Primary identification using Gemini API"""
        try:
            # If Gemini not enabled, return failure immediately
            if not self.enabled or not self.gemini_url:
                return {"success": False, "error": "Gemini API key not configured", "service": "gemini"}

            base64_image = self._encode_image(image_path)
            
            prompt = """
            Identify this plant species from the image. Provide detailed information.
            Respond with ONLY a JSON object in this exact format:
            {
                "plant_name": "common name",
                "scientific_name": "scientific name",
                "family": "plant family",
                "confidence": 0.0-1.0,
                "characteristics": ["list of key identifying features"],
                "care_level": "beginner/intermediate/expert"
            }
            """
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }]
            }
            
            response = requests.post(
                self.gemini_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                return {"success": False, "error": f"Gemini API error: {response.status_code}"}
            
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Extract JSON
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                plant_data = json.loads(text_response[json_start:json_end])
                return {
                    "success": True,
                    "service": "gemini",
                    "data": plant_data
                }
            
            return {"success": False, "error": "Could not parse Gemini response"}
            
        except Exception as e:
            return {"success": False, "error": str(e), "service": "gemini"}
    
    def identify_with_plantid(self, image_path: str) -> Dict[str, Any]:
        """Fallback identification using PlantID API"""
        if not self.plantid_api_key or self.plantid_api_key == "your_plantid_api_key_here":
            return {"success": False, "error": "PlantID API key not configured", "service": "plantid"}
        
        try:
            with open(image_path, 'rb') as f:
                files = {'images': f}
                data = {
                    'organs': 'leaf',
                    'include_related_images': 'false'
                }
                headers = {
                    'Api-Key': self.plantid_api_key
                }
                
                response = requests.post(
                    self.plantid_url,
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code != 200:
                    return {"success": False, "error": f"PlantID API error: {response.status_code}", "service": "plantid"}
                
                result = response.json()
                
                if result.get('suggestions') and len(result['suggestions']) > 0:
                    best_match = result['suggestions'][0]
                    return {
                        "success": True,
                        "service": "plantid",
                        "data": {
                            "plant_name": best_match.get('plant_name', 'Unknown'),
                            "scientific_name": best_match.get('scientific_name', 'Unknown'),
                            "confidence": best_match.get('probability', 0.0),
                            "family": best_match.get('family', 'Unknown')
                        }
                    }
                
                return {"success": False, "error": "No plant identified by PlantID", "service": "plantid"}
                
        except Exception as e:
            return {"success": False, "error": str(e), "service": "plantid"}
    
    def identify_with_plantnet(self, image_path: str) -> Dict[str, Any]:
        """Fallback identification using PlantNet API"""
        if not self.plantnet_api_key or self.plantnet_api_key == "your_plantnet_api_key_here":
            return {"success": False, "error": "PlantNet API key not configured", "service": "plantnet"}
        
        try:
            with open(image_path, 'rb') as f:
                files = {'images': f}
                params = {
                    'organs': 'leaf'
                }
                headers = {
                    'Authorization': f"Bearer {self.plantnet_api_key}"
                }
                
                response = requests.post(
                    self.plantnet_url,
                    files=files,
                    params=params,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code != 200:
                    return {"success": False, "error": f"PlantNet API error: {response.status_code}", "service": "plantnet"}
                
                result = response.json()
                
                if result.get('results') and len(result['results']) > 0:
                    best_match = result['results'][0]
                    species = best_match.get('species', {})
                    return {
                        "success": True,
                        "service": "plantnet",
                        "data": {
                            "plant_name": species.get('common_names', [{}])[0].get('name', 'Unknown') if species.get('common_names') else 'Unknown',
                            "scientific_name": species.get('scientific_name', 'Unknown'),
                            "confidence": best_match.get('score', 0.0),
                            "family": species.get('family', {}).get('scientific_name', 'Unknown') if species.get('family') else 'Unknown'
                        }
                    }
                
                return {"success": False, "error": "No plant identified by PlantNet", "service": "plantnet"}
                
        except Exception as e:
            return {"success": False, "error": str(e), "service": "plantnet"}
    
    def identify_plant(self, image_path: str) -> Dict[str, Any]:
        """
        Main identification method with fallback chain:
        1. Try Gemini (primary)
        2. Try PlantID (fallback 1)
        3. Try PlantNet (fallback 2)
        """
        # Try primary service (Gemini)
        result = self.identify_with_gemini(image_path)
        if result.get('success'):
            return {
                "success": True,
                "plant_data": result['data'],
                "service_used": result['service'],
                "fallback_used": False
            }
        
        # Try fallback 1 (PlantID)
        result = self.identify_with_plantid(image_path)
        if result.get('success'):
            return {
                "success": True,
                "plant_data": result['data'],
                "service_used": result['service'],
                "fallback_used": True,
                "primary_failed": True
            }
        
        # Try fallback 2 (PlantNet)
        result = self.identify_with_plantnet(image_path)
        if result.get('success'):
            return {
                "success": True,
                "plant_data": result['data'],
                "service_used": result['service'],
                "fallback_used": True,
                "primary_failed": True
            }

        # Fallback 3: local TFLite inference as a best-effort identification
        try:
            local_service = get_inference_service()
            pred = local_service.predict_crop(image_path)
            # Build a minimal plant_data structure from the model prediction
            plant_data = {
                "plant_name": pred.get('crop_type', 'Unknown'),
                "scientific_name": pred.get('detected_raw_crop', 'Unknown'),
                "family": "Unknown",
                "confidence": pred.get('confidence_score', 0.0),
                "characteristics": [],
                "care_level": "beginner"
            }
            return {
                "success": True,
                "plant_data": plant_data,
                "service_used": "local_model",
                "fallback_used": True,
                "primary_failed": True
            }
        except Exception as e:
            # If local inference also fails, continue to final failure
            pass
        
        # All services failed
        return {
            "success": False,
            "error": "All identification services failed",
            "services_attempted": ["gemini", "plantid", "plantnet"]
        }


class CareRecommendationService:
    """Generates care and treatment recommendations for identified plants"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}"
    
    def generate_care_guide(self, plant_data: Dict[str, Any], disease_info: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generates comprehensive care recommendations for the identified plant
        """
        try:
            plant_name = plant_data.get('plant_name', 'Unknown Plant')
            scientific_name = plant_data.get('scientific_name', 'Unknown')
            
            prompt = f"""
            Generate a comprehensive care guide for {plant_name} ({scientific_name}).
            
            Provide detailed recommendations in JSON format:
            {{
                "watering": {{
                    "frequency": "how often",
                    "amount": "how much",
                    "tips": ["tip1", "tip2"]
                }},
                "light": {{
                    "requirement": "full sun/partial shade/full shade",
                    "hours_per_day": number,
                    "tips": ["tip1", "tip2"]
                }},
                "soil": {{
                    "type": "soil type",
                    "ph_range": "pH range",
                    "drainage": "drainage requirements"
                }},
                "fertilizing": {{
                    "frequency": "how often",
                    "type": "fertilizer type",
                    "season": "best season"
                }},
                "common_diseases": [
                    {{
                        "name": "disease name",
                        "symptoms": ["symptom1", "symptom2"],
                        "treatment": "treatment description",
                        "prevention": "prevention tips"
                    }}
                ],
                "general_tips": ["tip1", "tip2", "tip3"]
            }}
            
            Make it practical and specific to {plant_name}.
            """
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(
                self.gemini_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                return {"success": False, "error": f"Gemini API error: {response.status_code}"}
            
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Extract JSON
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                care_data = json.loads(text_response[json_start:json_end])
                return {
                    "success": True,
                    "care_guide": care_data
                }
            
            return {"success": False, "error": "Could not parse care guide response"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_treatment_plan(self, plant_name: str, disease: str, severity: str) -> Dict[str, Any]:
        """
        Generates specific treatment plan for identified disease
        """
        try:
            prompt = f"""
            Generate a treatment plan for {plant_name} with {disease} (severity: {severity}).
            
            Provide in JSON format:
            {{
                "immediate_actions": ["action1", "action2"],
                "treatment_steps": [
                    {{
                        "step": 1,
                        "action": "description",
                        "products": ["product1", "product2"],
                        "duration": "how long"
                    }}
                ],
                "organic_treatments": ["option1", "option2"],
                "chemical_treatments": ["option1", "option2"],
                "prevention": ["prevention1", "prevention2"],
                "monitoring": {{
                    "frequency": "how often to check",
                    "signs_of_recovery": ["sign1", "sign2"],
                    "when_to_seek_help": "indicators"
                }}
            }}
            
            Make it practical and actionable for farmers.
            """
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(
                self.gemini_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                return {"success": False, "error": f"Gemini API error: {response.status_code}"}
            
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            
            # Extract JSON
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                treatment_data = json.loads(text_response[json_start:json_end])
                return {
                    "success": True,
                    "treatment_plan": treatment_data
                }
            
            return {"success": False, "error": "Could not parse treatment plan response"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}


class PDFReportGenerator:
    """Generates professional PDF reports from analysis results"""
    
    def __init__(self):
        self.reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")
        os.makedirs(self.reports_dir, exist_ok=True)
    
    def generate_report(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a PDF report from the complete analysis
        Returns report metadata and file path
        """
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            
            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_filename = f"plant_analysis_{timestamp}.pdf"
            report_path = os.path.join(self.reports_dir, report_filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(report_path, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#2E7D32'),
                spaceAfter=30,
                alignment=1  # Center
            )
            story.append(Paragraph("Plant Analysis Report", title_style))
            story.append(Spacer(1, 0.2*inch))
            
            # Date and Time
            story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
            
            # Plant Identification Section
            if analysis_data.get('plant_identification', {}).get('success'):
                plant_data = analysis_data['plant_identification']['plant_data']
                story.append(Paragraph("Plant Identification", styles['Heading2']))
                
                identification_info = [
                    ['Field', 'Details'],
                    ['Plant Name', plant_data.get('plant_name', 'N/A')],
                    ['Scientific Name', plant_data.get('scientific_name', 'N/A')],
                    ['Family', plant_data.get('family', 'N/A')],
                    ['Confidence', f"{plant_data.get('confidence', 0) * 100:.1f}%"],
                    ['Care Level', plant_data.get('care_level', 'N/A')]
                ]
                
                id_table = Table(identification_info, colWidths=[2.5*inch, 4*inch])
                id_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 14),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F1F8E9')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 1), (-1, -1), 11),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                story.append(id_table)
                story.append(Spacer(1, 0.3*inch))
            
            # Care Guide Section
            if analysis_data.get('care_recommendations', {}).get('success'):
                care_data = analysis_data['care_recommendations']['care_guide']
                story.append(Paragraph("Care Guide", styles['Heading2']))
                
                # Watering
                if 'watering' in care_data:
                    story.append(Paragraph("<b>Watering</b>", styles['Heading3']))
                    watering = care_data['watering']
                    story.append(Paragraph(f"Frequency: {watering.get('frequency', 'N/A')}", styles['Normal']))
                    story.append(Paragraph(f"Amount: {watering.get('amount', 'N/A')}", styles['Normal']))
                    if watering.get('tips'):
                        story.append(Paragraph("Tips:", styles['Normal']))
                        for tip in watering['tips']:
                            story.append(Paragraph(f"• {tip}", styles['Normal']))
                    story.append(Spacer(1, 0.2*inch))
                
                # Light
                if 'light' in care_data:
                    story.append(Paragraph("<b>Light Requirements</b>", styles['Heading3']))
                    light = care_data['light']
                    story.append(Paragraph(f"Requirement: {light.get('requirement', 'N/A')}", styles['Normal']))
                    story.append(Paragraph(f"Hours per day: {light.get('hours_per_day', 'N/A')}", styles['Normal']))
                    story.append(Spacer(1, 0.2*inch))
                
                # Soil
                if 'soil' in care_data:
                    story.append(Paragraph("<b>Soil Requirements</b>", styles['Heading3']))
                    soil = care_data['soil']
                    story.append(Paragraph(f"Type: {soil.get('type', 'N/A')}", styles['Normal']))
                    story.append(Paragraph(f"pH Range: {soil.get('ph_range', 'N/A')}", styles['Normal']))
                    story.append(Paragraph(f"Drainage: {soil.get('drainage', 'N/A')}", styles['Normal']))
                    story.append(Spacer(1, 0.2*inch))
                
                # Common Diseases
                if 'common_diseases' in care_data and care_data['common_diseases']:
                    story.append(Paragraph("<b>Common Diseases</b>", styles['Heading3']))
                    for disease in care_data['common_diseases'][:3]:  # Top 3 diseases
                        story.append(Paragraph(f"<b>{disease.get('name', 'Unknown')}</b>", styles['Normal']))
                        story.append(Paragraph(f"Symptoms: {', '.join(disease.get('symptoms', []))}", styles['Normal']))
                        story.append(Paragraph(f"Treatment: {disease.get('treatment', 'N/A')}", styles['Normal']))
                        story.append(Spacer(1, 0.1*inch))
            
            # Treatment Plan Section
            if analysis_data.get('treatment_plan', {}).get('success'):
                treatment = analysis_data['treatment_plan']['treatment_plan']
                story.append(Paragraph("Treatment Plan", styles['Heading2']))
                
                if treatment.get('immediate_actions'):
                    story.append(Paragraph("<b>Immediate Actions:</b>", styles['Normal']))
                    for action in treatment['immediate_actions']:
                        story.append(Paragraph(f"• {action}", styles['Normal']))
                    story.append(Spacer(1, 0.1*inch))
                
                if treatment.get('prevention'):
                    story.append(Paragraph("<b>Prevention Measures:</b>", styles['Normal']))
                    for prevention in treatment['prevention'][:5]:
                        story.append(Paragraph(f"• {prevention}", styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            return {
                "success": True,
                "report_path": report_path,
                "report_filename": report_filename,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instances
_image_validation_service = None
_plant_identification_service = None
_care_recommendation_service = None
_pdf_report_generator = None


def get_image_validation_service() -> ImageValidationService:
    global _image_validation_service
    if _image_validation_service is None:
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        _image_validation_service = ImageValidationService(gemini_key)
    return _image_validation_service


def get_plant_identification_service() -> PlantIdentificationService:
    global _plant_identification_service
    if _plant_identification_service is None:
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        plantid_key = os.getenv("PLANTID_API_KEY", "")
        plantnet_key = os.getenv("PLANTNET_API_KEY", "")
        _plant_identification_service = PlantIdentificationService(gemini_key, plantid_key, plantnet_key)
    return _plant_identification_service


def get_care_recommendation_service() -> CareRecommendationService:
    global _care_recommendation_service
    if _care_recommendation_service is None:
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        _care_recommendation_service = CareRecommendationService(gemini_key)
    return _care_recommendation_service


def get_pdf_report_generator() -> PDFReportGenerator:
    global _pdf_report_generator
    if _pdf_report_generator is None:
        _pdf_report_generator = PDFReportGenerator()
    return _pdf_report_generator