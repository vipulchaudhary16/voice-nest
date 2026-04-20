const express = require('express');
const router = express.Router();
const exophoneController = require('../controllers/exophoneController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(exophoneController.getExophones).post(exophoneController.createExophone);

router.route('/:id').delete(exophoneController.deleteExophone);

module.exports = router;
