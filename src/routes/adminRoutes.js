const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers.js");
const adminAuth = require("../middleware/adminAuth.js");

router.post("/login", adminControllers.Login);
router.patch("/logout", adminAuth, adminControllers.Logout);
router.get("/user-list", adminAuth, adminControllers.ListOfEveryUserPaginated);
router.get(
	"/top-products-categories",
	adminAuth,
	adminControllers.GetTop3ProductsAndCategory
);
router.get("/orders", adminAuth, adminControllers.GetPaginatedUserOrders);
router.get("/orders/:id", adminAuth, adminControllers.GetUserOrderDetail);
router.patch(
	"/orders",
	adminAuth,
	adminControllers.ChangeMultipleUserOrdersStatus
);
router.delete("/orders", adminAuth, adminControllers.DeleteMultipleOrders);

module.exports = router;
