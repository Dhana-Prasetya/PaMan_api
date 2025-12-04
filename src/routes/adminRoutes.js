const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers.js");

router.post("/login", adminControllers.Login);
router.patch("/logout", adminControllers.Logout);

module.exports = router;
