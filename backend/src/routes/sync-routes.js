const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/from-exotel', syncController.syncFromExotel);
router.post('/:entity/:id', syncController.syncEntityToExotel);

module.exports = router;

