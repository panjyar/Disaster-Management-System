import { Router } from 'express';
import GeminiService from '../services/geminiService.js';
import GeocodingService from '../services/geocodingService.js';

const router = Router();

// NEW: GET /api/geocode - API information
router.get('/', (req, res) => {
  res.json({
    message: 'Geocoding API - Convert location names to coordinates',
    endpoints: {
      'POST /api/geocode': 'Geocode a location name or extract from description'
    },
    required_fields: {
      'location_name': 'string (optional if description provided)',
      'description': 'string (optional if location_name provided)'
    },
    example_request: {
      method: 'POST',
      body: {
        location_name: 'New York, NY'
      }
    }
  });
});

// EXISTING: POST /api/geocode
router.post('/', async (req, res) => {
  try {
    const { description, location_name } = req.body;
    
    let locationToGeocode = location_name;
    
    if (!locationToGeocode && description) {
      const extractedLocations = await GeminiService.extractLocation(description);
      if (extractedLocations.length > 0) {
        locationToGeocode = extractedLocations[0];
      }
    }
    
    if (!locationToGeocode) {
      return res.status(400).json({ error: 'No location found or provided' });
    }
    
    const coordinates = await GeocodingService.geocodeLocation(locationToGeocode);
    
    if (!coordinates) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      location_name: locationToGeocode,
      coordinates
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;