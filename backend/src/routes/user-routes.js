const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// router.use(protect);
// router.use(authorize('super_admin'));

router.route("/").get(userController.getUsers).post(userController.createUser);

module.exports = router;
