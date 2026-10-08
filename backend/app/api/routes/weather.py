"""
weather.py

FastAPI routes for real-time environmental telemetry (Weather, UV Index, Air Quality).
Powered by Open-Meteo public endpoints (free, open data, no credentials needed).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_optional_current_user
from app.models.user import User, UserProfile
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather & Environmental Telemetry"])


@router.get("/live")
def get_live_environment_telemetry(
    lat: Optional[float] = Query(None, description="Latitude coordinate"),
    lon: Optional[float] = Query(None, description="Longitude coordinate"),
    city: Optional[str] = Query(None, description="City name for geocoding lookup"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch real-time environmental telemetry (UV Index, Climate, Pollution, Temperature)
    using live Open-Meteo satellite and ground-station feeds.
    """
    target_lat = lat
    target_lon = lon
    location_label = None

    # 1. If city query provided, resolve via geocoding
    if city and city.strip():
        geo = WeatherService.resolve_city_coordinates(city.strip())
        if geo:
            target_lat = geo["latitude"]
            target_lon = geo["longitude"]
            parts = [geo["name"]]
            if geo.get("admin1"):
                parts.append(geo["admin1"])
            if geo.get("country"):
                parts.append(geo["country"])
            location_label = ", ".join(parts)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not resolve geographic coordinates for city '{city}'"
            )

    # 2. If lat/lon passed directly
    elif target_lat is not None and target_lon is not None:
        location_label = f"{target_lat:.2f}°, {target_lon:.2f}°"

    # 3. If authenticated user has a location in their profile
    elif current_user:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if profile and profile.location:
            geo = WeatherService.resolve_city_coordinates(profile.location)
            if geo:
                target_lat = geo["latitude"]
                target_lon = geo["longitude"]
                location_label = f"{geo['name']}, {geo.get('country', '')}"

    # 4. Fallback default: New Delhi (28.6139, 77.2090)
    if target_lat is None or target_lon is None:
        target_lat = 28.6139
        target_lon = 77.2090
        location_label = "New Delhi, India"

    telemetry = WeatherService.fetch_live_telemetry(
        latitude=target_lat,
        longitude=target_lon,
        location_label=location_label
    )

    return telemetry
