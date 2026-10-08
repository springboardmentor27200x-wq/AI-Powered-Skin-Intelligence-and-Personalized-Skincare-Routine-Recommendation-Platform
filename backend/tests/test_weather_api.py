import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.weather_service import WeatherService

client = TestClient(app)


def test_weather_classification_logic():
    # UV Classification
    assert WeatherService.classify_uv(1.2) == "LOW"
    assert WeatherService.classify_uv(4.5) == "MODERATE"
    assert WeatherService.classify_uv(8.0) == "HIGH"
    assert WeatherService.classify_uv(11.0) == "HIGH"

    # Pollution Classification
    assert WeatherService.classify_pollution(8.0) == "LOW"
    assert WeatherService.classify_pollution(25.0) == "MODERATE"
    assert WeatherService.classify_pollution(65.0) == "HIGH"

    # Climate Classification
    assert WeatherService.classify_climate(5.0, 50.0) == "COLD"
    assert WeatherService.classify_climate(36.0, 50.0) == "HOT"
    assert WeatherService.classify_climate(22.0, 20.0) == "DRY"
    assert WeatherService.classify_climate(22.0, 80.0) == "HUMID"
    assert WeatherService.classify_climate(22.0, 50.0) == "TEMPERATE"


def test_clinical_advice_generation():
    advice = WeatherService.generate_clinical_advice(
        uv_bracket="HIGH",
        pollution_bracket="HIGH",
        climate_bracket="DRY",
        uv_index=7.5,
        humidity_pct=25.0,
        pm2_5=52.0,
        temp_c=28.0
    )
    assert len(advice) >= 3
    advice_text = " ".join(advice)
    assert "SPF 50+" in advice_text
    assert "Double cleanse" in advice_text
    assert "hyaluronic acid" in advice_text


def test_weather_live_endpoint_with_coordinates():
    # Test with coordinates for New Delhi
    response = client.get("/api/v1/weather/live?lat=28.6139&lon=77.2090")
    assert response.status_code == 200
    data = response.json()
    assert "raw_telemetry" in data
    assert "classified_exposure" in data
    assert "clinical_advice" in data
    assert data["classified_exposure"]["uv_exposure"] in {"LOW", "MODERATE", "HIGH"}
    assert data["classified_exposure"]["pollution_exposure"] in {"LOW", "MODERATE", "HIGH"}
    assert data["classified_exposure"]["climate"] in {"DRY", "HUMID", "TEMPERATE", "COLD", "HOT"}


def test_weather_live_endpoint_default():
    # Test fallback default endpoint
    response = client.get("/api/v1/weather/live")
    assert response.status_code == 200
    data = response.json()
    assert "raw_telemetry" in data
    assert "classified_exposure" in data
    assert len(data["clinical_advice"]) > 0
