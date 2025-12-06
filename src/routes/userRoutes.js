const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers.js");
const userAuth = require("../middleware/userAuth.js");
const { upload } = require("../middleware/upload.js");
const userOrderControllers = require("../controllers/userOrderControllers.js");
const userAdressControllers = require("../controllers/userAdressControllers.js");

// Main user routes
router.post("/login", userController.Login);
router.post("/register", userController.Register);
router.get("/my-profile", userAuth, userController.MyProfile);
router.patch("/edit-profile-data", userAuth, userController.EditProfileData);
router.patch("/edit-avatar", userAuth, upload, userController.EditAvatar);
router.patch("/change-password", userAuth, userController.ChangePassword);
router.delete("/delete-account", userAuth, userController.DeleteMyAccount);
router.patch("/logout", userAuth, userController.Logout);

// Address user routes
router.post("/address", userAuth, userAdressControllers.AddUserAddress);
router.get("/address", userAuth, userAdressControllers.GetUserAddresses);
router.patch(
	"/address-default/:id",
	userAuth,
	userAdressControllers.SetDefaultUserAddresses
);
router.patch(
	"/address-update/:id",
	userAuth,
	userAdressControllers.UpdateUserAddresses
);
router.delete(
	"/address/:id",
	userAuth,
	userAdressControllers.DeleteUserAddresses
);

// Order user routes
// router.post("/order/:id", userAuth, userOrderControllers.OrderProductDirectly);

module.exports = router;
