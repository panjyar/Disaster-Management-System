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
      
      // Extract location if not provided
      let finalLocationName = location_name;
      if (!finalLocationName && description) {
        const extractedLocations = await GeminiService.extractLocation(description);
        if (extractedLocations.length > 0) {
          finalLocationName = extractedLocations[0];
        }
      }
      
      // Geocode location
      let coordinates = null;
      if (finalLocationName) {
        const geocoded = await GeocodingService.geocodeLocation(finalLocationName);
        if (geocoded) {
          coordinates = `POINT(${geocoded.lng} ${geocoded.lat})`;
        }
      }
      
      // Fix: Use supabase.from() instead of from()
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
      
      // Emit real-time update
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
      
      // Fix: Use supabase.from() instead of from()
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
      
      // Get current disaster for audit trail
      // Fix: Use supabase.from() instead of from()
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
      
      // Fix: Use supabase.from() instead of from()
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
      
      // Emit real-time update
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
      
      // Fix: Use supabase.from() instead of from()
      const { error } = await supabase
        .from('disasters')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      // Emit real-time update
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
}

export default DisastersController;
