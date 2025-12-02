const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers.js");
const adminAuth = require("../middleware/adminAuth.js"); // Import the protect (jwt token) middleware
const { upload } = require("../middleware/upload.js");

router.get("/", productController.getProductsPagination);
router.get("/:id", productController.getDetailProduct);
router.post("/", adminAuth, upload, productController.insertProduct); // Integrating cloudinary upload middleware
router.patch("/data/:id", adminAuth, productController.updateProductData);
router.patch(
	"/image/:id",
	adminAuth,
	upload,
	productController.updateProductImage
);
router.delete("/:id", adminAuth, productController.deleteProduct);

module.exports = router;
