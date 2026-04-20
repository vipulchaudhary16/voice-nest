const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(campaignController.getCampaigns).post(campaignController.createCampaign);

router
  .route('/:id')
  .get(campaignController.getCampaign)
  .put(campaignController.updateCampaign)
  .delete(campaignController.deleteCampaign);

router.get('/:id/call-details', campaignController.getCampaignCallDetails);

module.exports = router;
