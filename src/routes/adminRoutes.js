const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers.js");
const paginationValidation = require("../middleware/paginationValidation.js");
const adminCookieAuth = require("../middleware/adminCookieAuth.js");

router.post("/login", adminControllers.Login);
router.post("/refresh", adminControllers.RefreshToken);
router.patch("/logout", adminCookieAuth, adminControllers.Logout);
router.get(
	"/user-list",
	adminCookieAuth,
	paginationValidation,
	adminControllers.ListOfEveryUserPaginated,
);
router.get(
	"/top-products-categories",
	adminCookieAuth,
	adminControllers.GetTop3ProductsAndCategory,
);
router.get(
	"/orders",
	adminCookieAuth,
	paginationValidation,
	adminControllers.GetPaginatedUserOrders,
);
router.get("/orders/:id", adminCookieAuth, adminControllers.GetUserOrderDetail);
router.patch(
	"/orders",
	adminCookieAuth,
	adminControllers.ChangeMultipleUserOrdersStatus,
);
router.delete("/orders", adminCookieAuth, adminControllers.DeleteMultipleOrders);

module.exports = router;
