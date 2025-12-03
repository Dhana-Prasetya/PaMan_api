const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers.js");
const userAuth = require("../middleware/userAuth.js");
const { upload } = require("../middleware/upload.js");

router.post("/login", userController.Login);
router.post("/register", userController.Register);
router.get("/my-profile", userAuth, userController.MyProfile);
router.patch("/edit-profile-data", userAuth, userController.EditProfileData);
router.patch("/edit-avatar", userAuth, upload, userController.EditAvatar);
router.patch("/change-password", userAuth, userController.ChangePassword);
router.delete("/delete-account", userAuth, userController.DeleteMyAccount);
module.exports = router;
