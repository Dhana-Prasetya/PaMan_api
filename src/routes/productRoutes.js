const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers.js");
const adminAuth = require("../middleware/adminAuth.js"); // Import the protect (jwt token) middleware
const { upload } = require("../middleware/upload.js");
const paginationValidation = require("../middleware/paginationValidation.js");
const idValidation = require("../middleware/idValidation.js");

router.get("/", paginationValidation, productController.GetProductsPagination);
router.get(
	"/search",
	paginationValidation,
	productController.SearchProductByNamePaginated,
);
router.post("/", adminAuth, upload, productController.InsertProduct); // Integrating cloudinary upload middleware
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
	adminAuth,
	idValidation,
	productController.UpdateProductData,
);
router.patch(
	"/image/:id",
	idValidation,
	adminAuth,
	upload,
	productController.UpdateProductImage,
);
router.delete("/:id", adminAuth, idValidation, productController.DeleteProduct);

module.exports = router;
