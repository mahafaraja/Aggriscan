from app.services.crop_health_service import CropHealthService


def _service():
    # api_key is irrelevant for pure normalization tests (no network used)
    return CropHealthService(api_key="test-key")


def test_parse_disease_response_to_common_shape():
    payload = {
        "result": {
            "is_plant": {"probability": 0.99, "binary": True, "threshold": 0.5},
            "crop": {"suggestions": [
                {"name": "tomato", "scientific_name": "Solanum lycopersicum", "probability": 0.94},
            ]},
            "disease": {"suggestions": [
                {
                    "name": "late blight",
                    "scientific_name": "Phytophthora infestans",
                    "probability": 0.87,
                    "details": {"treatment": {"chemical": ["copper fungicide"]}, "symptoms": {"A": "dark lesions"}},
                },
            ]},
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
    assert out["treatment"] == {"chemical": ["copper fungicide"]}


def test_parse_healthy_response():
    payload = {
        "result": {
            "is_plant": {"probability": 0.99, "binary": True},
            "crop": {"suggestions": [
                {"name": "cassava", "scientific_name": "Manihot esculenta", "probability": 0.9},
            ]},
            "disease": {"suggestions": [
                {"name": "healthy", "scientific_name": "healthy", "probability": 0.95},
            ]},
        },
    }
    out = _service()._parse(payload)
    assert out["status"] == "healthy"
    assert out["disease_label"] == "Cassava_Healthy"
    assert out["severity"] == "Low"
    assert out["is_healthy"] is True
    # confidence comes from the "healthy" suggestion, not the crop probability
    assert out["confidence_score"] == 0.95


def test_uses_top_disease_suggestion():
    payload = {
        "result": {
            "is_plant": {"probability": 0.95, "binary": True},
            "crop": {"suggestions": [
                {"name": "maize", "scientific_name": "Zea mays", "probability": 0.9},
            ]},
            "disease": {"suggestions": [
                {"name": "leaf rust", "scientific_name": "Puccinia sorghi", "probability": 0.82, "details": {}},
            ]},
        },
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
