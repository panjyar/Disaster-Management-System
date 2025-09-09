import { Router } from 'express';
import supabase from '../utils/supabase.js';

const router = Router();

// GET /api/resources - List all resources or provide API info
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offsetNum = parseInt(offset) || 0;

    // Try to fetch resources from database
    const { data, error, count } = await supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .limit(limitNum)
      .range(offsetNum, offsetNum + limitNum - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      
      // If table doesn't exist, return helpful response
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.json({
          resources: [],
          message: 'Resources table not found. Use /api/resources/:disasterId to get mock resources for a specific disaster.',
          total: 0,
          endpoints: {
            'GET /api/resources': 'List all resources (requires database setup)',
            'GET /api/resources/:disasterId': 'Get resources for a specific disaster (with mock data fallback)'
          }
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch resources',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.json({
      resources: data || [],
      message: (data?.length === 0) ? 'No resources found. Use /api/resources/:disasterId to get resources for a specific disaster.' : undefined,
      total: count || 0,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: (count || 0) > offsetNum + limitNum
      }
    });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/resources/:disasterId - Get resources for specific disaster
router.get('/:disasterId', async (req, res) => {
  try {
    const { disasterId } = req.params;
    const { lat, lng, radius = 10000, limit = 20 } = req.query;
    
    if (!disasterId) {
      return res.status(400).json({ error: 'Disaster ID is required' });
    }

    // Validate disaster exists first
    try {
      const { data: disaster, error: disasterError } = await supabase
        .from('disasters')
        .select('id, title, location_name')
        .eq('id', disasterId)
        .single();
      
      if (disasterError || !disaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }
    } catch (disasterCheckError) {
      console.warn('Could not verify disaster existence:', disasterCheckError.message);
      // Continue anyway - might be using mock data
    }
    
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', disasterId)
      .limit(parseInt(limit) || 20);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      
      // If resources table doesn't exist or query fails, return mock data
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('Resources table not found, returning mock data');
        return res.json(getMockResources(disasterId));
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch resources',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // If no data found, return mock resources
    if (!data || data.length === 0) {
      console.log('No resources found in database, returning mock data');
      return res.json(getMockResources(disasterId));
    }
    
    res.json(data);
  } catch (error) {
    console.error('Resources fetch error:', error);
    
    // As a final fallback, return mock data
    try {
      res.json(getMockResources(req.params.disasterId));
    } catch (mockError) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// POST /api/resources - Create new resource
router.post('/', async (req, res) => {
  try {
    const { disaster_id, name, type, location_name, description, contact_info, availability } = req.body;
    
    if (!disaster_id || !name || !type) {
      return res.status(400).json({ 
        error: 'disaster_id, name, and type are required',
        received: { 
          disaster_id: !!disaster_id, 
          name: !!name, 
          type: !!type 
        }
      });
    }

    const resourceData = {
      disaster_id,
      name,
      type,
      location_name: location_name || null,
      description: description || null,
      contact_info: contact_info || null,
      availability: availability || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return res.status(501).json({ 
          error: 'Resources table not implemented',
          message: 'Resource creation requires database setup'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create resource',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`disaster_${disaster_id}`).emit('resource_created', data);
    }
    
    console.log(`Resource created: ${name} for disaster ${disaster_id}`);
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to generate mock resources
function getMockResources(disasterId) {
  const resourceTypes = [
    { type: 'shelter', names: ['Emergency Shelter', 'Community Center', 'Evacuation Center', 'Temporary Housing'] },
    { type: 'food', names: ['Food Distribution Point', 'Mobile Kitchen', 'Food Bank', 'Soup Kitchen'] },
    { type: 'medical', names: ['Medical Station', 'First Aid Post', 'Mobile Clinic', 'Emergency Hospital'] },
    { type: 'supply', names: ['Supply Distribution', 'Equipment Center', 'Relief Supplies', 'Emergency Supplies'] },
    { type: 'transport', names: ['Emergency Transport', 'Evacuation Bus', 'Medical Transport', 'Supply Transport'] }
  ];

  const locations = [
    'Community Center', 'Local School', 'Fire Station', 'City Hall', 
    'Sports Complex', 'Church Hall', 'Library', 'Community Park'
  ];

  const mockResources = [];
  
  resourceTypes.forEach((resourceType, index) => {
    const name = resourceType.names[Math.floor(Math.random() * resourceType.names.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    mockResources.push({
      id: `mock-${index + 1}`,
      disaster_id: disasterId,
      name,
      location_name: location,
      type: resourceType.type,
      description: `${name} available at ${location}. Contact for more information.`,
      contact_info: `+1-555-0${100 + index}`,
      availability: Math.random() > 0.2 ? 'available' : 'limited',
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time within last 24h
      updated_at: new Date().toISOString()
    });
  });

  return mockResources;
}

export default router;