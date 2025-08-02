import { Router } from 'express';
import GeminiService from '../services/geminiService.js';

const router = Router();

// NEW: GET /api/verification - API information
router.get('/', (req, res) => {
  res.json({
    message: 'Image Verification API - Verify authenticity of disaster-related images',
    endpoints: {
      'POST /api/verification/verify-image': 'Verify an image URL'
    },
    required_fields: {
      'image_url': 'string (required)',
      'context': 'string (optional)'
    },
    example_request: {
      method: 'POST',
      url: '/api/verification/verify-image',
      body: {
        image_url: 'https://example.com/image.jpg',
        context: 'Flood in downtown area'
      }
    }
  });
});

// EXISTING: POST /api/verification/verify-image
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

export default router;