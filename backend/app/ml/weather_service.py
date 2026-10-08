"""
Weather & Environmental Data Service
====================================
Uses Open-Meteo (free, no API key required).
Fetches temperature, humidity, UV index.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

# Default location (can be made user-specific later)
DEFAULT_LAT = 28.6139   # New Delhi
DEFAULT_LON = 77.2090


def get_current_weather(
    lat: float = DEFAULT_LAT,
    lon: float = DEFAULT_LON,
) -> Dict[str, Any]:
    """
    Fetch current weather + UV index from Open-Meteo.
    Returns a normalized dict. Falls back to empty values on failure.
    """
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,weather_code,uv_index"
        "&timezone=auto"
    )

    try:
        resp = requests.get(url, timeout=6)
        resp.raise_for_status()
        data = resp.json()
        current = data.get("current", {})

        temperature = current.get("temperature_2m")
        humidity = current.get("relative_humidity_2m")
        uv_index = current.get("uv_index")
        weather_code = current.get("weather_code")

        # Simple season estimation from temperature + month can be added later
        return {
            "temperature": temperature,
            "humidity": humidity,
            "uv_index": uv_index,
            "weather_code": weather_code,
            "source": "open-meteo",
            "success": True,
        }

    except Exception as e:
        logger.warning("Weather API failed: %s", e)
        return {
            "temperature": None,
            "humidity": None,
            "uv_index": None,
            "weather_code": None,
            "source": "fallback",
            "success": False,
        }


def get_environmental_signals(weather: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Convert raw weather data into simple signals used by seasonal tips.
    """
    if weather is None:
        weather = get_current_weather()

    uv = weather.get("uv_index")
    humidity = weather.get("humidity")
    temp = weather.get("temperature")

    signals = {
        "high_uv": False,
        "high_humidity": False,
        "low_humidity": False,
        "hot": False,
        "cold": False,
        "raw": weather,
    }

    if uv is not None:
        signals["high_uv"] = uv >= 7

    if humidity is not None:
        signals["high_humidity"] = humidity >= 70
        signals["low_humidity"] = humidity <= 35

    if temp is not None:
        signals["hot"] = temp >= 32
        signals["cold"] = temp <= 15

    return signals