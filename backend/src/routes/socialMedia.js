const express = require('express');
const SocialMediaService = require('../services/socialMediaService');

const router = express.Router();

// GET /api/social-media/reports/:disasterId
router.get('/reports/:disasterId', async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { tags } = req.query;
    
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const reports = await SocialMediaService.fetchDisasterReports(disasterId, tagArray);
    
    res.json(reports);
  } catch (error) {
    console.error('Social media reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/social-media/analyze-priority
router.post('/analyze-priority', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const priority = await SocialMediaService.analyzePriority(content);
    
    res.json({ priority });
  } catch (error) {
    console.error('Priority analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;