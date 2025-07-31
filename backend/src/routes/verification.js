const express = require('express');
const GeminiService = require('../services/geminiService');

const router = express.Router();

// POST /api/verification/verify-image
router.post('/verify-image', async (req, res) => {
  try {
    const { image_url, context = '' } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const verification = await GeminiService.verifyImage(image_url, context);
    
    res.json(verification);
  } catch (error) {
    console.error('Image verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;