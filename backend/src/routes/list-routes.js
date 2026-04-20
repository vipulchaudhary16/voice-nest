const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(listController.getLists)
  .post(listController.createList);

router.route('/:id')
  .delete(listController.deleteList);

router.route('/:id/contacts')
  .post(listController.addContactsToList);

router.route('/:id/contacts/:contactId')
  .delete(listController.removeContactFromList);

module.exports = router;
