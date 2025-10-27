import { Router } from 'express';
import DisastersController from '../controllers/disastersController.js';
import supabase from '../utils/supabase.js';
import auth from '../middleware/auth.js';

const router = Router();

// Add health check route
router.get('/health', DisastersController.healthCheck);

// Existing routes
router.get('/', DisastersController.getDisasters);
router.post('/', auth('contributor'), DisastersController.createDisaster);
router.put('/:id', auth('contributor'), DisastersController.updateDisaster);
router.delete('/:id', auth('admin'), DisastersController.deleteDisaster);
router.post('/:id/reports', auth('contributor'), DisastersController.createReport);

// Additional utility routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Disaster ID is required' });
    }

    const { data, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      return res.status(500).json({ 
        error: 'Failed to fetch disaster',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Get disaster error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;