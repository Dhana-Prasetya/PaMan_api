const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers.js");
const userAuth = require("../middleware/userAuth.js");
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
router.patch("/edit-profile-data", userAuth, userController.EditProfileData);
router.patch("/edit-avatar", userAuth, upload, userController.EditAvatar);
router.patch("/change-password", userAuth, userController.ChangePassword);
router.delete("/delete-account", userAuth, userController.DeleteMyAccount);
router.patch("/logout", userCookieAuth, userController.Logout);

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
router.post("/order", userAuth, userOrderControllers.OrderProductDirectly);
router.get("/order", userAuth, userOrderControllers.GetPaginatedMyOrders);
router.get("/order/:id", userAuth, userOrderControllers.GetMyDetailOrder);

// Rating user routes
router.post(
	"/rate-product/:id",
	userAuth,
	userRatingProductsController.RateProduct
);

router.patch(
	"/helpful/:id/:rate",
	userAuth,
	userRatingProductsController.MarkHelpfulOrNot
);

// Cart user routes
router.get("/cart", userAuth, userCartControllers.GetUserCart);
router.post("/cart/:id", userAuth, userCartControllers.AddProductToCart);
router.patch(
	"/cart/:id",
	userAuth,
	userCartControllers.DecreaseProductQuantityFromCart
);
router.delete(
	"/cart",
	userAuth,
	userCartControllers.RemoveMultipleProductFromCart
);
router.post(
	"/cart-checkout",
	userAuth,
	userCartControllers.CheckoutProductFromCart
);

module.exports = router;
