import { Router } from 'express';
import supabase from '../utils/supabase.js';

const router = Router();

// NEW: GET /api/resources - List all resources or provide API info
router.get('/', async (req, res) => {
  try {
    // Option 1: Return all resources (limit for performance)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .limit(50)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    // If no resources, return empty array with helpful message
    res.json({
      resources: data || [],
      message: data?.length === 0 ? 'No resources found. Use /api/resources/:disasterId to get resources for a specific disaster.' : undefined,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// EXISTING: GET /api/resources/:disasterId
router.get('/:disasterId', async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { lat, lng, radius = 10000 } = req.query;
    
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', disasterId);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      const mockResources = [
        {
          id: 'mock-1',
          disaster_id: disasterId,
          name: 'Emergency Shelter',
          location_name: 'Community Center',
          type: 'shelter',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          disaster_id: disasterId,
          name: 'Food Distribution Point',
          location_name: 'Local School',
          type: 'food',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-3',
          disaster_id: disasterId,
          name: 'Medical Station',
          location_name: 'Fire Station',
          type: 'hospital',
          created_at: new Date().toISOString()
        }
      ];
      return res.json(mockResources);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;