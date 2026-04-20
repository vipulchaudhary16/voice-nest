const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const importController = require("../controllers/importController");

router.use(protect);

router.get("/types", importController.listImportTypes);
router.get("/template", importController.downloadTemplate);
router.post("/run", importController.runImport);

module.exports = router;
