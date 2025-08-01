import { Router } from 'express';
import DisastersController from '../controllers/disastersController.js';

const router = Router();

router.get('/', DisastersController.getDisasters);
router.post('/', DisastersController.createDisaster);
router.put('/:id', DisastersController.updateDisaster);
router.delete('/:id', DisastersController.deleteDisaster);

export default router;
