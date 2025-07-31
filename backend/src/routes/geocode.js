const express = require('express');
const GeminiService = require('../services/geminiService');
const GeocodingService = require('../services/geocodingService');

const router = express.Router();

// POST /api/geocode
router.post('/', async (req, res) => {
  try {
    const { description, location_name } = req.body;
    
    let locationToGeocode = location_name;
    
    // Extract location if not provided
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

module.exports = router;