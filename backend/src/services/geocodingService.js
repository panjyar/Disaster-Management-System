const axios = require('axios');
const CacheService = require('./cacheService');

class GeocodingService {
  static async geocodeLocation(locationName) {
    const cacheKey = `geocode_${locationName}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Try Google Maps first if API key is available
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: locationName,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const coordinates = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formatted_address: result.formatted_address
          };
          
          await CacheService.set(cacheKey, coordinates, 1440); // Cache for 24 hours
          return coordinates;
        }
      }
      
      // Fallback to OpenStreetMap Nominatim (free)
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: locationName,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'DisasterResponsePlatform/1.0'
        }
      });

      if (response.data.length > 0) {
        const result = response.data[0];
        const coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          formatted_address: result.display_name
        };
        
        await CacheService.set(cacheKey, coordinates, 1440);
        return coordinates;
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}

module.exports = GeocodingService;