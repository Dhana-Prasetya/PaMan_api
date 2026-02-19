const express = require("express");
const router = express.Router();
const googleController = require("../controllers/googleController.js");

router.get("/", googleController.Authentication);
router.get("/callback", googleController.Callback);

module.exports = router;
