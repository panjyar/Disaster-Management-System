import { Router } from 'express';
import supabase from '../utils/supabase.js';

const router = Router();

// GET /api/resources/:disasterId
router.get('/:disasterId', async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { lat, lng, radius = 10000 } = req.query; // radius in meters
    
    // Fix: Use supabase.from() instead of from()
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', disasterId);
    
    // If coordinates provided, find resources within radius
    if (lat && lng) {
      // For now, we'll use a simple query since we don't have the stored procedure
      // In production, you'd create a stored procedure for geospatial queries
      query = query.select('*');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    // Mock some resources if none exist for demo purposes
    if (data.length === 0) {
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