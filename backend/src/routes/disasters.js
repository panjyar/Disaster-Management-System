const express = require('express');
const DisastersController = require('../controllers/disastersController');

const router = express.Router();

// GET /api/disasters
router.get('/', DisastersController.getDisasters);

// POST /api/disasters
router.post('/', DisastersController.createDisaster);

// PUT /api/disasters/:id
router.put('/:id', DisastersController.updateDisaster);

// DELETE /api/disasters/:id
router.delete('/:id', DisastersController.deleteDisaster);

module.exports = router;