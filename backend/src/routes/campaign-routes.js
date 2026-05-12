const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const campaignCallController = require('../controllers/campaignCallController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(campaignController.getCampaigns).post(campaignController.createCampaign);

router
  .route('/:id')
  .get(campaignController.getCampaign)
  .delete(campaignController.deleteCampaign);

router.get('/:id/call-details', campaignController.getCampaignCallDetails);
router.get('/calls/:callSid', campaignCallController.getCallDetails);

module.exports = router;
