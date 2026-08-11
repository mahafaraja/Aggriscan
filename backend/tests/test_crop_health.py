from app.services.crop_health_service import CropHealthService


def _service():
    # api_key is irrelevant for pure normalization tests (no network used)
    return CropHealthService(api_key="test-key")


def test_parse_disease_response_to_common_shape():
    payload = {
        "result": {
            "is_healthy": {"probability": 0.05, "binary": False},
            "is_plant": {"probability": 0.99, "binary": True},
            "disease": {"name": "late blight", "probability": 0.87, "binary": True},
            "disease_details": {"scientific_name": "Phytophthora infestans"},
            "crop": {"name": "tomato", "probability": 0.94, "binary": True},
        },
    }
    out = _service()._parse(payload)
    assert out["success"] is True
    assert out["status"] == "success"
    assert out["crop_type"] == "Tomato"
    assert out["disease_label"] == "Tomato_Late_Blight"
    assert out["confidence_score"] == 0.87
    assert out["severity"] == "High"
    assert out["model_used"] == "crop_health"
    assert out["is_healthy"] is False


def test_parse_healthy_response():
    payload = {
        "result": {
            "is_healthy": {"probability": 0.97, "binary": True},
            "crop": {"name": "cassava", "probability": 0.9, "binary": True},
        },
    }
    out = _service()._parse(payload)
    assert out["status"] == "healthy"
    assert out["disease_label"] == "Cassava_Healthy"
    assert out["severity"] == "Low"
    assert out["is_healthy"] is True


def test_uses_suggestions_when_primary_disease_missing():
    payload = {
        "result": {
            "is_healthy": {"probability": 0.1, "binary": False},
            "crop": {"name": "maize", "probability": 0.9, "binary": True},
        },
        "suggestions": [
            {"name": "leaf rust", "probability": 0.82},
        ],
    }
    out = _service()._parse(payload)
    assert out["disease_label"] == "Maize_Leaf_Rust"
    assert out["confidence_score"] == 0.82


def test_crop_and_disease_normalization():
    svc = _service()
    assert svc._normalize_crop("Solanum lycopersicum") == "Tomato"
    assert svc._normalize_crop("Zea mays") == "Maize"
    assert svc._normalize_crop("manihot") == "Cassava"
    assert svc._disease_suffix("Late blight", "Phytophthora infestans") == "Late_Blight"
    assert svc._disease_suffix("Some Novel Disease", "X spp.") == "Some_Novel_Disease"
