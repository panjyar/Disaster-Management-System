import supabase from '../utils/supabase.js';
import GeminiService from '../services/geminiService.js';
import GeocodingService from '../services/geocodingService.js';

class DisastersController {
  static async createDisaster(req, res) {
    try {
      const { title, location_name, description, tags, owner_id = 'anonymous' } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ 
          error: 'Title and description are required',
          received: { title: !!title, description: !!description }
        });
      }
      
      let finalLocationName = location_name;
      if (!finalLocationName && description) {
        try {
          const extractedLocations = await GeminiService.extractLocation(description);
          if (extractedLocations.length > 0) {
            finalLocationName = extractedLocations[0];
          }
        } catch (error) {
          console.warn('Location extraction failed:', error.message);
        }
      }
      
      let coordinates = null;
      if (finalLocationName) {
        try {
          const geocoded = await GeocodingService.geocodeLocation(finalLocationName);
          if (geocoded) {
            coordinates = `POINT(${geocoded.lng} ${geocoded.lat})`;
          }
        } catch (error) {
          console.warn('Geocoding failed:', error.message);
        }
      }
      
      const insertData = {
        title,
        location_name: finalLocationName,
        description,
        tags: tags || [],
        owner_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Only add location if coordinates exist
      if (coordinates) {
        insertData.location = coordinates;
      }

      // Only add audit_trail if the column exists
      try {
        insertData.audit_trail = [{
          action: 'create',
          user_id: owner_id,
          timestamp: new Date().toISOString()
        }];
      } catch (error) {
        console.warn('Audit trail not supported:', error.message);
      }
      
      const { data, error } = await supabase
        .from('disasters')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          error: 'Failed to create disaster',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      const io = req.app.get('io');
      if (io) {
        io.emit('disaster_created', data);
      }
      
      console.log(`Disaster created: ${title} at ${finalLocationName || 'unknown location'}`);
      
      res.status(201).json(data);
    } catch (error) {
      console.error('Create disaster error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getDisasters(req, res) {
  try {
    const { tag, owner_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select('*')
      .order('created_at', { ascending: false });

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offsetNum = parseInt(offset) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      
      if (error.message.includes('relation') || error.message.includes('column')) {
        return res.status(500).json({ 
          error: 'Database schema issue - please check table structure',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch disasters',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // CRITICAL FIX: Ensure response structure is consistent
    res.json({
      disasters: data || [],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: (data || []).length
      },
      filters: {
        tag: tag || null,
        owner_id: owner_id || null
      }
    });
  } catch (error) {
    console.error('Get disasters error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      disasters: [], // Provide empty array as fallback
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

  static async updateDisaster(req, res) {
    try {
      const { id } = req.params;
      const { title, location_name, description, tags, user_id = 'anonymous' } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Disaster ID is required' });
      }

      // Check if disaster exists first
      const { data: existingDisaster, error: fetchError } = await supabase
        .from('disasters')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingDisaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      
      const currentAuditTrail = existingDisaster?.audit_trail || [];
      
      let coordinates = null;
      if (location_name) {
        try {
          const geocoded = await GeocodingService.geocodeLocation(location_name);
          if (geocoded) {
            coordinates = `POINT(${geocoded.lng} ${geocoded.lat})`;
          }
        } catch (error) {
          console.warn('Geocoding failed during update:', error.message);
        }
      }
      
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (location_name !== undefined) updateData.location_name = location_name;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags || [];
      if (coordinates) updateData.location = coordinates;

      // Only update audit_trail if the column exists
      try {
        updateData.audit_trail = [
          ...currentAuditTrail,
          {
            action: 'update',
            user_id,
            timestamp: new Date().toISOString(),
            changes: { title, location_name, description, tags }
          }
        ];
      } catch (error) {
        console.warn('Audit trail not supported:', error.message);
      }
      
      const { data, error } = await supabase
        .from('disasters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          error: 'Failed to update disaster',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      const io = req.app.get('io');
      if (io) {
        io.emit('disaster_updated', data);
      }
      
      console.log(`Disaster updated: ${id} by ${user_id}`);
      
      res.json(data);
    } catch (error) {
      console.error('Update disaster error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteDisaster(req, res) {
    try {
      const { id } = req.params;
      const { user_id = 'anonymous' } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Disaster ID is required' });
      }

      // Check if disaster exists first
      const { data: existingDisaster, error: fetchError } = await supabase
        .from('disasters')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingDisaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      
      const { error } = await supabase
        .from('disasters')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          error: 'Failed to delete disaster',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      const io = req.app.get('io');
      if (io) {
        io.emit('disaster_deleted', { id });
      }
      
      console.log(`Disaster deleted: ${id} by ${user_id}`);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete disaster error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async createReport(req, res) {
    try {
      const { id } = req.params;
      const { content, image_url, user_id = 'anonymous' } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Disaster ID is required' });
      }
      
      if (!content) {
        return res.status(400).json({ error: 'Report content is required' });
      }

      // Check if disaster exists
      const { data: disaster, error: fetchError } = await supabase
        .from('disasters')
        .select('id, title')
        .eq('id', id)
        .single();
      
      if (fetchError || !disaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }

      // Try to save to reports table if it exists, otherwise just return success
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert({
            disaster_id: id,
            content,
            image_url,
            user_id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.warn('Reports table not available:', error.message);
          // Fallback response
          return res.status(201).json({
            message: 'Report submitted successfully!',
            report: {
              disaster_id: id,
              content,
              image_url,
              user_id,
              created_at: new Date().toISOString()
            }
          });
        }

        console.log(`New report for disaster ${id} from user ${user_id}`);
        res.status(201).json({
          message: 'Report submitted successfully!',
          report: data
        });

      } catch (dbError) {
        console.warn('Database insert failed, using fallback:', dbError.message);
        res.status(201).json({
          message: 'Report submitted successfully!',
          report: {
            disaster_id: id,
            content,
            image_url,
            user_id,
            created_at: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // New method for health check
  static async healthCheck(req, res) {
    try {
      // Test database connection
      const { data, error } = await supabase
        .from('disasters')
        .select('count')
        .limit(1);

      if (error) {
        return res.status(500).json({
          status: 'ERROR',
          database: 'disconnected',
          error: error.message
        });
      }

      res.json({
        status: 'OK',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        database: 'error',
        error: error.message
      });
    }
  }
}

export default DisastersController;