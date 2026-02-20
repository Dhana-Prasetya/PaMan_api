const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers.js");
const { upload } = require("../middleware/upload.js");
const paginationValidation = require("../middleware/paginationValidation.js");
const idValidation = require("../middleware/idValidation.js");
const adminCookieAuth = require("../middleware/adminCookieAuth.js"); // Middleware to check admin auth via cookie

router.get("/", paginationValidation, productController.GetProductsPagination);
router.get(
	"/search",
	paginationValidation,
	productController.SearchProductByNamePaginated,
);
router.post("/", adminCookieAuth, upload, productController.InsertProduct); // Integrating cloudinary upload middleware
router.get("/category", paginationValidation, productController.SortedProducts);

// Id route need to be at the end to avoid conflict with other routes
router.get(
	"/:id",
	idValidation,
	paginationValidation,
	productController.GetDetailProduct,
);
router.patch(
	"/data/:id",
	adminCookieAuth,
	idValidation,
	productController.UpdateProductData,
);
router.patch(
	"/image/:id",
	idValidation,
	adminCookieAuth,
	upload,
	productController.UpdateProductImage,
);
router.delete("/:id", adminCookieAuth, idValidation, productController.DeleteProduct);

module.exports = router;
