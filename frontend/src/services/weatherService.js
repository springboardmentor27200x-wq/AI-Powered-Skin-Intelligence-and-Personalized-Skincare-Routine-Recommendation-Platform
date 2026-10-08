import apiClient from './api';

export const weatherService = {
  /**
   * Fetch real-time environmental telemetry (UV Index, humidity, temp, AQI)
   * @param {Object} params - { lat, lon, city }
   */
  getLiveTelemetry: async (params = {}) => {
    const res = await apiClient.get('/weather/live', { params });
    return res.data;
  },

  /**
   * Auto-detect user coordinates via HTML5 Geolocation API
   * @returns {Promise<{lat: number, lon: number}>}
   */
  detectBrowserLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          let message = 'Unable to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission was denied. You can enter your city manually.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information is unavailable.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out.';
          }
          reject(new Error(message));
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    });
  },
};
