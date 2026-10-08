"""
weather_service.py

Integrates Open-Meteo public APIs (100% free, no API key required) for:
1. Live Weather & UV Index (Forecast endpoint)
2. Live Air Quality & PM2.5 / PM10 (Air Quality endpoint)
3. Geocoding / City Lookup (Geocoding endpoint)

Classifies telemetry into clinical exposure brackets matching
the EnvironmentalExposureRecord schema:
- uv_exposure: LOW, MODERATE, HIGH
- pollution_exposure: LOW, MODERATE, HIGH
- climate: DRY, HUMID, TEMPERATE, COLD, HOT
"""

import logging
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
OPEN_METEO_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"


class WeatherService:
    @classmethod
    def resolve_city_coordinates(cls, city: str) -> Optional[Dict[str, Any]]:
        """Look up coordinates and location details by city name using Open-Meteo Geocoding."""
        try:
            params = {
                "name": city.strip(),
                "count": 1,
                "language": "en",
                "format": "json"
            }
            with httpx.Client(timeout=6.0) as client:
                resp = client.get(OPEN_METEO_GEO_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results")
                    if results and len(results) > 0:
                        first = results[0]
                        return {
                            "name": first.get("name"),
                            "latitude": float(first.get("latitude")),
                            "longitude": float(first.get("longitude")),
                            "country": first.get("country", ""),
                            "admin1": first.get("admin1", ""),
                        }
        except Exception as e:
            logger.warning(f"Geocoding lookup failed for '{city}': {e}")
        return None

    @classmethod
    def classify_uv(cls, uv_index: float) -> str:
        """Map raw UV index to LOW, MODERATE, HIGH."""
        if uv_index < 3.0:
            return "LOW"
        elif uv_index < 6.0:
            return "MODERATE"
        else:
            return "HIGH"

    @classmethod
    def classify_pollution(cls, pm2_5: float) -> str:
        """Map PM2.5 concentration (ug/m3) to LOW, MODERATE, HIGH."""
        if pm2_5 < 15.0:
            return "LOW"
        elif pm2_5 <= 45.0:
            return "MODERATE"
        else:
            return "HIGH"

    @classmethod
    def classify_climate(cls, temp_c: float, humidity_pct: float) -> str:
        """Map temperature and humidity to DRY, HUMID, TEMPERATE, COLD, HOT."""
        if temp_c < 10.0:
            return "COLD"
        elif temp_c > 32.0:
            return "HOT"
        elif humidity_pct < 35.0:
            return "DRY"
        elif humidity_pct > 65.0:
            return "HUMID"
        else:
            return "TEMPERATE"

    @classmethod
    def generate_clinical_advice(cls, uv_bracket: str, pollution_bracket: str, climate_bracket: str,
                                 uv_index: float, humidity_pct: float, pm2_5: float, temp_c: float) -> list[str]:
        """Generate targeted clinical skincare recommendations based on environmental exposure."""
        advice = []
        # UV advice
        if uv_bracket == "HIGH":
            advice.append(f"High UV Index ({uv_index:.1f}): Broad-spectrum SPF 50+ is essential. Reapply every 2 hours if outdoors.")
        elif uv_bracket == "MODERATE":
            advice.append(f"Moderate UV Index ({uv_index:.1f}): Daily SPF 30+ recommended; wear sunglasses or seek shade midday.")
        else:
            advice.append(f"Low UV Index ({uv_index:.1f}): Baseline SPF 30 protection is adequate for everyday exposure.")

        # Pollution advice
        if pollution_bracket == "HIGH":
            advice.append(f"Elevated Particulate Pollution (PM2.5: {pm2_5:.0f} µg/m³): Double cleanse this evening and apply an antioxidant serum (Vitamin C / Niacinamide) to neutralize free radicals.")
        elif pollution_bracket == "MODERATE":
            advice.append(f"Moderate Air Quality (PM2.5: {pm2_5:.0f} µg/m³): Gentle evening cleanser recommended to remove surface pollutants.")

        # Climate advice
        if climate_bracket == "DRY":
            advice.append(f"Arid Atmosphere (Humidity: {humidity_pct:.0f}%): Apply hyaluronic acid on damp skin and seal immediately with a ceramide moisturizer to prevent transepidermal water loss.")
        elif climate_bracket == "HUMID":
            advice.append(f"High Ambient Humidity ({humidity_pct:.0f}%): Consider lightweight gel-based moisturizers and non-comedogenic formulations to prevent pore congestion.")
        elif climate_bracket == "HOT":
            advice.append(f"High Temperature ({temp_c:.1f}°C): Increased sweat & sebum excretion. Keep skin clean and opt for mattifying sunscreens.")
        elif climate_bracket == "COLD":
            advice.append(f"Chilly Climate ({temp_c:.1f}°C): Cold winds can compromise the lipid barrier. Use barrier repair creams rich in squalane and ceramides.")

        return advice

    @classmethod
    def fetch_live_telemetry(
        cls,
        latitude: float,
        longitude: float,
        location_label: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch real-time weather, UV, and air quality from Open-Meteo.
        Returns mapped exposure brackets + raw telemetry + clinical advice.
        """
        weather_data = {}
        air_data = {}

        # 1. Fetch Weather & UV
        try:
            with httpx.Client(timeout=6.0) as client:
                w_resp = client.get(
                    OPEN_METEO_WEATHER_URL,
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "current": "temperature_2m,relative_humidity_2m,uv_index",
                        "timezone": "auto"
                    }
                )
                if w_resp.status_code == 200:
                    weather_data = w_resp.json().get("current", {})
        except Exception as e:
            logger.warning(f"Failed to fetch Open-Meteo weather: {e}")

        # 2. Fetch Air Quality
        try:
            with httpx.Client(timeout=6.0) as client:
                a_resp = client.get(
                    OPEN_METEO_AIR_URL,
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "current": "pm2_5,pm10,european_aqi"
                    }
                )
                if a_resp.status_code == 200:
                    air_data = a_resp.json().get("current", {})
        except Exception as e:
            logger.warning(f"Failed to fetch Open-Meteo air quality: {e}")

        # Extract values with fallbacks
        temp_c = float(weather_data.get("temperature_2m", 25.0))
        humidity_pct = float(weather_data.get("relative_humidity_2m", 50.0))
        uv_index = float(weather_data.get("uv_index", 2.0))
        pm2_5 = float(air_data.get("pm2_5", 12.0))
        pm10 = float(air_data.get("pm10", 20.0))
        aqi = int(air_data.get("european_aqi", 25))

        # Classify brackets
        uv_exposure = cls.classify_uv(uv_index)
        pollution_exposure = cls.classify_pollution(pm2_5)
        climate = cls.classify_climate(temp_c, humidity_pct)

        # Generate advice
        clinical_advice = cls.generate_clinical_advice(
            uv_bracket=uv_exposure,
            pollution_bracket=pollution_exposure,
            climate_bracket=climate,
            uv_index=uv_index,
            humidity_pct=humidity_pct,
            pm2_5=pm2_5,
            temp_c=temp_c
        )

        return {
            "location_label": location_label or f"{latitude:.2f}°, {longitude:.2f}°",
            "latitude": latitude,
            "longitude": longitude,
            "raw_telemetry": {
                "temperature_c": temp_c,
                "humidity_pct": humidity_pct,
                "uv_index": uv_index,
                "pm2_5": pm2_5,
                "pm10": pm10,
                "aqi": aqi
            },
            "classified_exposure": {
                "uv_exposure": uv_exposure,
                "pollution_exposure": pollution_exposure,
                "climate": climate
            },
            "clinical_advice": clinical_advice,
            "source": "Open-Meteo Meteorological & Copernicus Atmospheric Feeds"
        }
