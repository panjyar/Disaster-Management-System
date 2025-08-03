import supabase from '../utils/supabase.js';
import GeminiService from '../services/geminiService.js';
import GeocodingService from '../services/geocodingService.js';

class DisastersController {
  static async createDisaster(req, res) {
    try {
      const { title, location_name, description, tags, owner_id = 'anonymous' } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }
      
      let finalLocationName = location_name;
      if (!finalLocationName && description) {
        const extractedLocations = await GeminiService.extractLocation(description);
        if (extractedLocations.length > 0) {
          finalLocationName = extractedLocations[0];
        }
      }
      
      let coordinates = null;
      if (finalLocationName) {
        const geocoded = await GeocodingService.geocodeLocation(finalLocationName);
        if (geocoded) {
          coordinates = `POINT(${geocoded.lng} ${geocoded.lat})`;
        }
      }
      
      const { data, error } = await supabase
        .from('disasters')
        .insert({
          title,
          location_name: finalLocationName,
          location: coordinates,
          description,
          tags: tags || [],
          owner_id,
          audit_trail: [{
            action: 'create',
            user_id: owner_id,
            timestamp: new Date().toISOString()
          }]
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      const io = req.app.get('io');
      if (io) {
        io.emit('disaster_created', data);
      }
      
      console.log(`Disaster created: ${title} at ${finalLocationName || 'unknown location'}`);
      
      res.status(201).json(data);
    } catch (error) {
      console.error('Create disaster error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisasters(req, res) {
    try {
      const { tag, owner_id, limit = 50, offset = 0 } = req.query;
      
      let query = supabase
        .from('disasters')
        .select('*')
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      if (tag) {
        query = query.contains('tags', [tag]);
      }
      
      if (owner_id) {
        query = query.eq('owner_id', owner_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Database error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Get disasters error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateDisaster(req, res) {
    try {
      const { id } = req.params;
      const { title, location_name, description, tags, user_id = 'anonymous' } = req.body;
      
      const { data: currentDisaster } = await supabase
        .from('disasters')
        .select('audit_trail')
        .eq('id', id)
        .single();
      
      if (!currentDisaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      
      const currentAuditTrail = currentDisaster?.audit_trail || [];
      
      let coordinates = null;
      if (location_name) {
        const geocoded = await GeocodingService.geocodeLocation(location_name);
        if (geocoded) {
          coordinates = `POINT(${geocoded.lng} ${geocoded.lat})`;
        }
      }
      
      const { data, error } = await supabase
        .from('disasters')
        .update({
          title,
          location_name,
          location: coordinates,
          description,
          tags: tags || [],
          audit_trail: [
            ...currentAuditTrail,
            {
              action: 'update',
              user_id,
              timestamp: new Date().toISOString(),
              changes: { title, location_name, description, tags }
            }
          ]
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      const io = req.app.get('io');
      if (io) {
        io.emit('disaster_updated', data);
      }
      
      console.log(`Disaster updated: ${id} by ${user_id}`);
      
      res.json(data);
    } catch (error) {
      console.error('Update disaster error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteDisaster(req, res) {
    try {
      const { id } = req.params;
      const { user_id = 'anonymous' } = req.body;
      
      const { error } = await supabase
        .from('disasters')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      const io = req.app.get('io');
      if (io) {
        io.emit('disaster_deleted', { id });
      }
      
      console.log(`Disaster deleted: ${id} by ${user_id}`);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete disaster error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // Add this new method inside the DisastersController class
static async createReport(req, res) {
  try {
    const { id } = req.params;
    const { content, image_url, user_id } = req.body;
    
    // Validate request body
    if (!content) {
      return res.status(400).json({ error: 'Report content is required' });
    }
    
    // In a real implementation, you would save this report to the database.
    // For this example, we will just return a success message.
    
    // Hypothetical DB insert logic:
    // const { data, error } = await supabase.from('reports').insert({ disaster_id: id, content, image_url, user_id });

    console.log(`New report for disaster ${id} from user ${user_id}`);
    res.status(201).json({
      message: 'Report submitted successfully!',
      report: {
        disaster_id: id,
        content,
        image_url,
        user_id
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
}

export default DisastersController;
