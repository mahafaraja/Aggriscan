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
import logging
from typing import Dict, Any, Optional, List
from PIL import Image
import io
from datetime import datetime
from .inference import get_inference_service
from ..config import settings

logger = logging.getLogger(__name__)

GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _gemini_generate_url(api_key):
    """Build the Gemini generateContent URL using the configured model.

    `gemini-2.0-flash` has been retired from the project's model registry and
    returns HTTP 404, so the model is configurable via GEMINI_MODEL
    (default `gemini-2.5-flash`).
    """
    if not api_key:
        return None
    model = (settings.GEMINI_MODEL or "").strip() or "gemini-2.5-flash"
    return f"{GOOGLE_API_BASE}/models/{model}:generateContent?key={api_key}"


class ImageValidationService:
    """Validates if an image contains a plant"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.gemini_url = _gemini_generate_url(gemini_api_key)
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
        self.enabled = bool(gemini_api_key)
        
        self.gemini_url = _gemini_generate_url(gemini_api_key)
        self.plantid_url = "https://api.plant.id/identify"
        self.plantnet_url = "https://my-api.plantnet.org/v2/identify/all"
        logger.info(
            "Plant identification service initialized gemini_configured=%s plantid_configured=%s plantnet_configured=%s",
            bool(gemini_api_key),
            bool(plantid_api_key),
            bool(plantnet_api_key),
        )
    
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    def identify_with_gemini(self, image_path: str) -> Dict[str, Any]:
        """Primary identification using Gemini API"""
        try:
            # If Gemini not enabled, return failure immediately
            if not self.enabled or not self.gemini_url:
                logger.warning("Gemini identification skipped because GEMINI_API_KEY is not configured")
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
                logger.error("Gemini identification failed with status=%s body=%s", response.status_code, response.text[:500])
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
            logger.exception("Gemini identification failed")
            return {"success": False, "error": str(e), "service": "gemini"}
    
    def identify_with_plantid(self, image_path: str) -> Dict[str, Any]:
        """Fallback identification using PlantID API"""
        if not self.plantid_api_key or self.plantid_api_key == "your_plantid_api_key_here":
            logger.info("PlantID skipped because PLANTID_API_KEY is not configured")
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
            logger.exception("PlantID identification failed")
            return {"success": False, "error": str(e), "service": "plantid"}
    
    def identify_with_plantnet(self, image_path: str) -> Dict[str, Any]:
        """Primary identification using PlantNet API (replaces gatekeeper)"""
        if not self.plantnet_api_key or self.plantnet_api_key == "your_plantnet_api_key_here":
            logger.info("PlantNet skipped because PLANTNET_API_KEY is not configured")
            return {"success": False, "error": "PlantNet API key not configured", "service": "plantnet"}
        
        try:
            # PlantNet only accepts JPEG/PNG - convert WebP/other formats
            import io
            from PIL import Image as PILImage
            img = PILImage.open(image_path).convert('RGB')
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG', quality=95)
            img_buffer.seek(0)
            
            files = {'images': ('image.jpg', img_buffer, 'image/jpeg')}
            data = {
                'organs': 'leaf'
            }
            headers = {
                'Authorization': f"Bearer {self.plantnet_api_key}"
            }
            
            response = requests.post(
                self.plantnet_url,
                files=files,
                data=data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                return {"success": False, "error": f"PlantNet API error: {response.status_code}", "service": "plantnet"}
            
            result = response.json()
            
            if result.get('results') and len(result['results']) > 0:
                best_match = result['results'][0]
                species = best_match.get('species', {})
                # PlantNet v2 response format uses scientificNameWithoutAuthor and commonNames
                common_names = species.get('commonNames', [])
                return {
                    "success": True,
                    "service": "plantnet",
                    "data": {
                        "plant_name": common_names[0] if common_names else species.get('scientificNameWithoutAuthor', 'Unknown'),
                        "scientific_name": species.get('scientificName', species.get('scientificNameWithoutAuthor', 'Unknown')),
                        "confidence": best_match.get('score', 0.0),
                        "family": species.get('family', {}).get('scientificName', 'Unknown') if species.get('family') else 'Unknown'
                    }
                }
            
            return {"success": False, "error": "No plant identified by PlantNet", "service": "plantnet"}
                
        except Exception as e:
            logger.exception("PlantNet identification failed")
            return {"success": False, "error": str(e), "service": "plantnet"}
    
    def identify_plant(self, image_path: str) -> Dict[str, Any]:
        """
        Main identification method with fallback chain:
        1. Try PlantNet (primary - replaces gatekeeper for plant identification)
        2. Try Gemini (fallback 1)
        3. Try PlantID (fallback 2)
        """
        # Try primary service (PlantNet) - replaces gatekeeper for plant identification
        result = self.identify_with_plantnet(image_path)
        if result.get('success'):
            logger.info("Plant identification succeeded using PlantNet (primary)")
            return {
                "success": True,
                "plant_data": result['data'],
                "service_used": result['service'],
                "fallback_used": False
            }
        
        # Try fallback 1 (Gemini)
        result = self.identify_with_gemini(image_path)
        if result.get('success'):
            logger.info("Plant identification succeeded using Gemini fallback")
            return {
                "success": True,
                "plant_data": result['data'],
                "service_used": result['service'],
                "fallback_used": True,
                "primary_failed": True
            }
        
        # Try fallback 2 (PlantID)
        result = self.identify_with_plantid(image_path)
        if result.get('success'):
            logger.info("Plant identification succeeded using PlantID fallback")
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
            logger.info("Plant identification using local model fallback: %s", pred)
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
            logger.exception("Local model identification fallback failed")
        
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
        self.gemini_url = _gemini_generate_url(gemini_api_key)
        self.care_rules = self._load_care_rules()
    
    def _load_care_rules(self) -> Dict[str, Any]:
        """Load care rules from JSON file"""
        try:
            import os
            import json
            rules_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "care_rules.json")
            if os.path.exists(rules_path):
                with open(rules_path, "r") as f:
                    return json.load(f)
            else:
                logger.warning("Care rules file not found: %s", rules_path)
                return {}
        except Exception as e:
            logger.error("Failed to load care rules: %s", str(e))
            return {}
    
    def generate_care_guide(self, plant_data: Dict[str, Any], disease_info: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generates comprehensive care recommendations for the identified plant
        Uses rule-based system as primary (no Gemini dependency)
        """
        try:
            plant_name = plant_data.get('plant_name', 'Unknown Plant')
            scientific_name = plant_data.get('scientific_name', 'Unknown')
            
            # Try Gemini first if available
            if self.gemini_api_key:
                try:
                    gemini_result = self._try_gemini_care_guide(plant_name, scientific_name)
                    if gemini_result.get('success'):
                        return gemini_result
                except Exception as e:
                    logger.warning("Gemini care guide failed, using rule-based: %s", str(e))
            
            # Fallback to rule-based system
            return self._get_rule_based_care_guide(plant_data, disease_info)
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _try_gemini_care_guide(self, plant_name: str, scientific_name: str) -> Dict[str, Any]:
        """Try to generate care guide using Gemini API"""
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
                "care_guide": care_data,
                "source": "gemini"
            }
        
        return {"success": False, "error": "Could not parse care guide response"}
    
    def _get_rule_based_care_guide(self, plant_data: Dict[str, Any], disease_info: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generate care guide using rule-based system (no AI required)
        """
        try:
            plant_name = plant_data.get('plant_name', 'Unknown Plant')
            scientific_name = plant_data.get('scientific_name', 'Unknown')
            
            # Determine crop type from plant name or scientific name
            crop_type = self._determine_crop_type(plant_name, scientific_name)
            
            # Get disease-specific care rules
            disease_label = disease_info.get('disease_label', 'Healthy') if disease_info else 'Healthy'
            disease_rules = self._get_disease_rules(crop_type, disease_label)
            
            if not disease_rules:
                # Return generic care guide if no specific rules found
                return self._get_generic_care_guide(plant_name, scientific_name)
            
            # Build comprehensive care guide from rules
            care_guide = {
                "disease_info": {
                    "name": disease_rules.get('disease_name', disease_label),
                    "severity": disease_rules.get('severity', 'Unknown'),
                    "symptoms": disease_rules.get('symptoms', []),
                    "immediate_actions": disease_rules.get('immediate_actions', [])
                },
                "treatment": disease_rules.get('treatment', {}),
                "prevention": disease_rules.get('prevention', []),
                "monitoring": disease_rules.get('monitoring', {}),
                "source": "rule_based"
            }
            
            return {
                "success": True,
                "care_guide": care_guide
            }
            
        except Exception as e:
            logger.error("Rule-based care guide generation failed: %s", str(e))
            return {"success": False, "error": str(e)}
    
    def _determine_crop_type(self, plant_name: str, scientific_name: str) -> str:
        """Determine crop type from plant name or scientific name"""
        name_lower = plant_name.lower()
        sci_lower = scientific_name.lower()
        
        crop_keywords = {
            "banana": ["banana", "musa"],
            "bean": ["bean", "phaseolus", "vigna"],
            "cassava": ["cassava", "manihot"],
            "coffee": ["coffee", "coffea"],
            "maize": ["maize", "corn", "zea"],
            "groundnuts": ["groundnut", "peanut", "arachis"],
            "potato": ["potato", "solanum tuberosum"],
            "tomato": ["tomato", "solanum lycopersicum"]
        }
        
        for crop, keywords in crop_keywords.items():
            if any(kw in name_lower or kw in sci_lower for kw in keywords):
                return crop
        
        return "unknown"
    
    def _get_disease_rules(self, crop_type: str, disease_label: str) -> Optional[Dict[str, Any]]:
        """Get disease-specific care rules"""
        if not self.care_rules or crop_type not in self.care_rules:
            return None
        
        crop_rules = self.care_rules[crop_type]
        
        # Try exact match first
        if disease_label in crop_rules:
            return crop_rules[disease_label]
        
        # Try case-insensitive match
        disease_label_lower = disease_label.lower()
        for key, value in crop_rules.items():
            if key.lower() == disease_label_lower:
                return value
        
        # If disease not found, return healthy plant rules
        healthy_key = f"{crop_type.capitalize()}_Healthy"
        if healthy_key in crop_rules:
            return crop_rules[healthy_key]
        
        return None
    
    def _get_generic_care_guide(self, plant_name: str, scientific_name: str) -> Dict[str, Any]:
        """Generate generic care guide when no specific rules are available"""
        return {
            "success": True,
            "care_guide": {
                "disease_info": {
                    "name": "General Care Guide",
                    "severity": "N/A",
                    "symptoms": ["No specific disease detected"],
                    "immediate_actions": ["Continue regular care routine"]
                },
                "treatment": {
                    "chemical": [],
                    "organic": []
                },
                "prevention": [
                    "Use certified disease-free planting material",
                    "Practice crop rotation",
                    "Ensure proper plant spacing",
                    "Maintain good field hygiene",
                    "Monitor regularly for early signs of disease"
                ],
                "monitoring": {
                    "frequency": "Weekly inspection",
                    "signs_of_recovery": ["Plant remains healthy"],
                    "when_to_seek_help": "If any disease symptoms appear"
                },
                "source": "generic"
            }
        }
    
    def generate_treatment_plan(self, plant_name: str, disease: str, severity: str) -> Dict[str, Any]:
        """
        Generates specific treatment plan for identified disease
        Uses rule-based system (no Gemini dependency)
        """
        try:
            # Determine crop type
            crop_type = self._determine_crop_type(plant_name, plant_name)
            
            # Get disease-specific rules
            disease_rules = self._get_disease_rules(crop_type, disease)
            
            if not disease_rules:
                return {
                    "success": False,
                    "error": f"No treatment rules available for {disease}"
                }
            
            # Build treatment plan from rules
            treatment_plan = {
                "immediate_actions": disease_rules.get('immediate_actions', []),
                "treatment_steps": [
                    {
                        "step": 1,
                        "action": "Apply chemical treatments" if disease_rules.get('treatment', {}).get('chemical') else "Apply organic treatments",
                        "products": disease_rules.get('treatment', {}).get('chemical', []) or disease_rules.get('treatment', {}).get('organic', []),
                        "duration": "As per product instructions"
                    }
                ],
                "organic_treatments": disease_rules.get('treatment', {}).get('organic', []),
                "chemical_treatments": disease_rules.get('treatment', {}).get('chemical', []),
                "prevention": disease_rules.get('prevention', []),
                "monitoring": disease_rules.get('monitoring', {})
            }
            
            return {
                "success": True,
                "treatment_plan": treatment_plan
            }
            
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
        gemini_key = settings.GEMINI_API_KEY
        _image_validation_service = ImageValidationService(gemini_key)
    return _image_validation_service


def get_plant_identification_service() -> PlantIdentificationService:
    global _plant_identification_service
    if _plant_identification_service is None:
        gemini_key = settings.GEMINI_API_KEY
        plantid_key = settings.PLANTID_API_KEY
        plantnet_key = settings.PLANTNET_API_KEY
        _plant_identification_service = PlantIdentificationService(gemini_key, plantid_key, plantnet_key)
    return _plant_identification_service


def get_care_recommendation_service() -> CareRecommendationService:
    global _care_recommendation_service
    if _care_recommendation_service is None:
        gemini_key = settings.GEMINI_API_KEY
        _care_recommendation_service = CareRecommendationService(gemini_key)
    return _care_recommendation_service


def get_pdf_report_generator() -> PDFReportGenerator:
    global _pdf_report_generator
    if _pdf_report_generator is None:
        _pdf_report_generator = PDFReportGenerator()
    return _pdf_report_generator
