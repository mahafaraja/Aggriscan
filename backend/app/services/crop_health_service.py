"""
Crop.health (Kindwise) disease-detection provider for AgriScan.

Responsibility (per plantnet&planthealth.md):
  - Identify the crop-health problem / disease in a farmer image.
  - Return a normalized, provider-agnostic diagnosis so that the rest of the
    pipeline (decision layer, disease templates, local-model fallback) does not
    need to know the third-party response shape.

Crop identity is the job of Pl@ntNet / PlantNet; Crop.health is the *health
diagnosis* provider. The two are NOT interchangeable.
"""
import io
import logging
from typing import Any, Dict, Optional

import requests
from PIL import Image

from ..config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Normalization maps
# ---------------------------------------------------------------------------
# AgriScan crop identifiers (aligned with the local model's crop_type values).
CROP_ALIASES = {
    "tomato": "Tomato",
    "solanum lycopersicum": "Tomato",
    "maize": "Maize",
    "corn": "Maize",
    "zea mays": "Maize",
    "banana": "Banana",
    "musa": "Banana",
    "bean": "Bean",
    "common bean": "Bean",
    "green bean": "Bean",
    "phaseolus": "Bean",
    "cassava": "Cassava",
    "manioc": "Cassava",
    "manihot": "Cassava",
    "coffee": "Coffee",
    "coffea": "Coffee",
    "groundnut": "Groundnuts",
    "groundnuts": "Groundnuts",
    "peanut": "Groundnuts",
    "arachis": "Groundnuts",
    "potato": "Potato",
    "solanum tuberosum": "Potato",
}

# External disease name / scientific name -> AgriScan disease-label suffix.
DISEASE_SUFFIXES = {
    "late blight": "Late_Blight",
    "phytophthora infestans": "Late_Blight",
    "early blight": "Early_Blight",
    "alternaria solani": "Early_Blight",
    "bacterial spot": "Bacterial_Spot",
    "xanthomonas": "Bacterial_Spot",
    "leaf mold": "Leaf_Mold",
    "leaf mould": "Leaf_Mold",
    "septoria leaf spot": "Septoria_Leaf_Spot",
    "septoria": "Septoria_Leaf_Spot",
    "target spot": "Target_Spot",
    "yellow leaf curl": "Yellow_Leaf_Curl_Virus",
    "mosaic": "Mosaic_Virus",
    "tomato mosaic": "Mosaic_Virus",
    "powdery mildew": "Powdery_Mildew",
    "rust": "Rust",
    "leaf rust": "Leaf_Rust",
    "black sigatoka": "Black_Sigatoka",
    "sigatoka": "Black_Sigatoka",
    "fusarium wilt": "Fusarium_Wilt",
    "bacterial wilt": "Bacterial_Wilt",
    "fusarium": "Fusarium_Wilt",
    "wilt": "Wilt",
    "cassava mosaic disease": "CMD",
    "cassava mosaic": "CMD",
    "cassava brown streak": "Brown_Streak",
    "cassava green mottle": "Green_Mottle",
    "cassava bacterial blight": "Bacterial_Blight",
    "angular leaf spot": "Angular_Leaf_Spot",
    "coffee leaf rust": "Leaf_Rust",
    "rosette": "Rosette",
}

class CropHealthService:
    """Calls the Kindwise Crop.health API and normalizes its response."""

    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        self.api_key = api_key or settings.CROP_HEALTH_API_KEY
        self.api_url = (api_url or settings.CROP_HEALTH_API_URL).rstrip("/")
        self.identification_url = f"{self.api_url}/identification"
        self.enabled = bool(self.api_key) and self.api_key != "your_crop_health_api_key_here"
        logger.info(
            "CropHealthService initialized enabled=%s url=%s",
            self.enabled,
            self.identification_url,
        )

    # -- normalization helpers --------------------------------------------
    def _normalize_crop(self, name: Optional[str]) -> str:
        if not name:
            return "Unknown"
        key = name.lower().strip()
        return CROP_ALIASES.get(key, key.capitalize())

    def _disease_suffix(self, name: Optional[str], scientific_name: Optional[str]) -> Optional[str]:
        candidates = []
        if name:
            candidates.append(name.lower().strip())
        if scientific_name:
            candidates.append(scientific_name.lower().strip())
        # Prefer the most specific (longest) matching key so e.g. "leaf rust"
        # maps to Leaf_Rust rather than the generic Rust.
        best: Optional[str] = None
        best_len = -1
        for cand in candidates:
            for raw, suffix in DISEASE_SUFFIXES.items():
                if raw in cand and len(raw) > best_len:
                    best = suffix
                    best_len = len(raw)
        if best is not None:
            return best
        if candidates:
            first = candidates[0]
            # fall back to a slug of the external name
            slug = "".join(
                ch if ch.isalnum() else "_" for ch in first.title()
            ).strip("_")
            return slug or None
        return None

    def _severity(self, is_healthy: bool, probability: float) -> str:
        if is_healthy:
            return "Low"
        if probability > 0.8:
            return "High"
        if probability > 0.5:
            return "Medium"
        return "Low"


    # -- main entry point ------------------------------------------------
    def identify_disease(self, image_path: str) -> Dict[str, Any]:
        """Call Crop.health and normalize into the common AgriScan shape."""
        if not self.enabled:
            logger.info("Crop.health skipped because CROP_HEALTH_API_KEY is not configured")
            return {
                "success": False,
                "status": "not_configured",
                "error": "Crop.health API key not configured",
                "model_used": "crop_health",
            }

        try:
            # Crop.health accepts JPEG/PNG — normalise any format to JPEG.
            img = Image.open(image_path).convert("RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=95)
            buffer.seek(0)

            files = {"image1": ("image.jpg", buffer, "image/jpeg")}
            # The `details` query param asks the API to enrich results with
            # treatment / prevention / symptoms guidance (used for farmer advice).
            params = {
                "language": "en",
                "details": (
                    "type,common_names,description,severity,symptoms,treatment,"
                    "prevention,url,wiki_url,taxonomy"
                ),
            }
            headers = {"Api-Key": self.api_key}

            logger.info("Calling Crop.health identification endpoint")
            response = requests.post(
                self.identification_url,
                files=files,
                params=params,
                headers=headers,
                timeout=30,
            )
            logger.info("Crop.health HTTP status=%s", response.status_code)

            if response.status_code not in (200, 201):
                self._log_error(response)
                return {
                    "success": False,
                    "status": "api_error",
                    "error": f"Crop.health API error {response.status_code}",
                    "http_status": response.status_code,
                    "model_used": "crop_health",
                }

            payload = response.json()
            return self._parse(payload)

        except requests.exceptions.Timeout:
            logger.exception("Crop.health request timed out")
            return {
                "success": False,
                "status": "api_error",
                "error": "Crop.health request timed out",
                "model_used": "crop_health",
            }
        except Exception as exc:  # noqa: BLE001
            logger.exception("Crop.health identification failed")
            return {
                "success": False,
                "status": "api_error",
                "error": str(exc),
                "model_used": "crop_health",
            }

    # -- response parsing ------------------------------------------------
    def _parse(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        result = payload.get("result") or {}

        # Current Crop.health schema returns suggestions arrays:
        #   result.crop.suggestions[0]  -> {name, scientific_name, probability, details}
        #   result.disease.suggestions[0] -> {name, scientific_name, probability, details}
        crop_suggestions = ((result.get("crop") or {}).get("suggestions")) or []
        disease_suggestions = ((result.get("disease") or {}).get("suggestions")) or []

        crop = crop_suggestions[0] if crop_suggestions else {}
        disease = disease_suggestions[0] if disease_suggestions else {}

        crop_name_raw = crop.get("name") or crop.get("scientific_name") or "Unknown"
        crop_scientific = crop.get("scientific_name")
        crop_prob = float(crop.get("probability", 0.0))

        disease_name = disease.get("name")
        scientific_name = disease.get("scientific_name")
        disease_prob = float(disease.get("probability", 0.0))
        details = disease.get("details") or {}

        # Some responses include an explicit is_healthy block (beta variant).
        is_healthy_obj = result.get("is_healthy") or {}
        is_healthy = bool(is_healthy_obj.get("binary", False))
        healthy_prob = float(is_healthy_obj.get("probability", 0.0))
        healthy_named = str(disease_name or "").lower() in ("healthy", "no disease", "none")

        if is_healthy or not disease_name or healthy_named:
            # Confidence reflects the strength of the healthy decision itself:
            # the "healthy" suggestion's probability, the explicit is_healthy
            # probability, or (weak fallback) the crop probability.
            if healthy_named:
                confidence = disease_prob or crop_prob or 0.5
            else:
                confidence = healthy_prob or crop_prob or 0.5
            return {
                "success": True,
                "status": "healthy" if (is_healthy or healthy_named) else "no_disease",
                "crop_type": self._normalize_crop(crop_name_raw),
                "crop_probability": crop_prob,
                "crop_scientific_name": crop_scientific,
                "disease_label": f"{self._normalize_crop(crop_name_raw)}_Healthy",
                "confidence_score": confidence,
                "severity": "Low",
                "detected_raw_crop": crop_name_raw,
                "model_used": "crop_health",
                "is_healthy": True,
                "source": "crop_health",
                "raw": payload,
            }

        crop_name = self._normalize_crop(crop_name_raw)
        disease_suffix = self._disease_suffix(disease_name, scientific_name) or "Disease"
        disease_label = f"{crop_name}_{disease_suffix}"

        return {
            "success": True,
            "status": "success",
            "crop_type": crop_name,
            "crop_probability": crop_prob,
            "crop_scientific_name": crop_scientific,
            "disease_label": disease_label,
            "confidence_score": disease_prob,
            "severity": self._severity(False, disease_prob),
            "detected_raw_crop": crop_name_raw,
            "model_used": "crop_health",
            "is_healthy": False,
            "disease_name": disease_name,
            "scientific_name": scientific_name,
            "treatment": details.get("treatment"),
            "symptoms": details.get("symptoms"),
            "severity_description": details.get("severity"),
            "description": details.get("description"),
            "source": "crop_health",
            "raw": payload,
        }

    @staticmethod
    def _log_error(response: requests.Response) -> None:
        try:
            logger.warning("Crop.health error body: %s", response.json())
        except Exception:  # noqa: BLE001
            logger.warning("Crop.health non-JSON error body: %s", response.text[:500])


# Singleton
_crop_health_service = None


def get_crop_health_service() -> CropHealthService:
    global _crop_health_service
    if _crop_health_service is None:
        _crop_health_service = CropHealthService()
    return _crop_health_service

