const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactControllers.js");

router.post("/", contactController.Contact);

module.exports = router;
