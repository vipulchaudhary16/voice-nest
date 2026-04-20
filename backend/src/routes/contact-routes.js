const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/tags', contactController.getContactTags);

router.route('/').get(contactController.getContacts).post(contactController.createContact);

router.route('/:id').put(contactController.updateContact).delete(contactController.deleteContact);

module.exports = router;
