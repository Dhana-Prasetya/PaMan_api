const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers.js");
const adminAuth = require("../middleware/adminAuth.js");

router.post("/login", adminControllers.Login);
router.patch("/logout", adminAuth, adminControllers.Logout);
router.get("/user-list", adminAuth, adminControllers.ListOfEveryUserPaginated);

module.exports = router;
