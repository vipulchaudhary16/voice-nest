const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super_admin'));

router.route('/').get(tenantController.getTenants).post(tenantController.createTenant);

router.route('/:id').put(tenantController.updateTenant);

module.exports = router;
