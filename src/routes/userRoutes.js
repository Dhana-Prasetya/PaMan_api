const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers.js");
const { upload } = require("../middleware/upload.js");
const userOrderControllers = require("../controllers/userOrderControllers.js");
const userAdressControllers = require("../controllers/userAdressControllers.js");
const userCartControllers = require("../controllers/userCartControllers.js");
const userRatingProductsController = require("../controllers/userRatingProductsController.js");
const userCookieAuth = require("../middleware/userCookieAuth.js");

// Main user routes
router.post("/login", userController.Login);
router.post("/register", userController.Register);
router.post("/refresh", userController.RefreshToken);
router.get("/my-profile", userCookieAuth, userController.MyProfile); // TEST
router.patch("/edit-profile-data", userCookieAuth, userController.EditProfileData);
router.patch("/edit-avatar", userCookieAuth, upload, userController.EditAvatar);
router.patch("/change-password", userCookieAuth, userController.ChangePassword);
router.delete("/delete-account", userCookieAuth, userController.DeleteMyAccount);
router.patch("/logout", userCookieAuth, userController.Logout);

// Address user routes
router.post("/address", userCookieAuth, userAdressControllers.AddUserAddress);
router.get("/address", userCookieAuth, userAdressControllers.GetUserAddresses);
router.patch(
	"/address-default/:id",
	userCookieAuth,
	userAdressControllers.SetDefaultUserAddresses
);
router.patch(
	"/address-update/:id",
	userCookieAuth,
	userAdressControllers.UpdateUserAddresses
);
router.delete(
	"/address/:id",
	userCookieAuth,
	userAdressControllers.DeleteUserAddresses
);

// Order user routes
router.post("/order", userCookieAuth, userOrderControllers.OrderProductDirectly);
router.get("/order", userCookieAuth, userOrderControllers.GetPaginatedMyOrders);
router.get("/order/:id", userCookieAuth, userOrderControllers.GetMyDetailOrder);

// Rating user routes
router.post(
	"/rate-product/:id",
	userCookieAuth,
	userRatingProductsController.RateProduct
);

router.patch(
	"/helpful/:id/:rate",
	userCookieAuth,
	userRatingProductsController.MarkHelpfulOrNot
);

// Cart user routes
router.get("/cart", userCookieAuth, userCartControllers.GetUserCart);
router.post("/cart/:id", userCookieAuth, userCartControllers.AddProductToCart);
router.patch(
	"/cart/:id",
	userCookieAuth,
	userCartControllers.DecreaseProductQuantityFromCart
);
router.delete(
	"/cart",
	userCookieAuth,
	userCartControllers.RemoveMultipleProductFromCart
);
router.post(
	"/cart-checkout",
	userCookieAuth,
	userCartControllers.CheckoutProductFromCart
);

module.exports = router;
