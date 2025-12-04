const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers.js");
const adminAuth = require("../middleware/adminAuth.js"); // Import the protect (jwt token) middleware
const { upload } = require("../middleware/upload.js");

router.get("/", productController.GetProductsPagination);
router.get("/search", productController.SearchProductByNamePaginated);
router.post("/", adminAuth, upload, productController.InsertProduct); // Integrating cloudinary upload middleware
router.get("/category", adminAuth, productController.AdminSortedProducts);

// Id route need to be at the end to avoid conflict with other routes
router.get("/:id", productController.GetDetailProduct);
router.patch("/data/:id", adminAuth, productController.UpdateProductData);
router.patch(
	"/image/:id",
	adminAuth,
	upload,
	productController.UpdateProductImage
);
router.delete("/:id", adminAuth, productController.DeleteProduct);

module.exports = router;
