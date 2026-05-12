const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(flowController.getFlows).post(flowController.createFlow);

router
  .route('/:id')
  .put(flowController.updateFlow)
  .delete(flowController.deleteFlow);

module.exports = router;
