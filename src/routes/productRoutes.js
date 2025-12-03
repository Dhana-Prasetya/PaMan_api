const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers.js");
const adminAuth = require("../middleware/adminAuth.js"); // Import the protect (jwt token) middleware
const { upload } = require("../middleware/upload.js");

router.get("/", productController.GetProductsPagination);
router.get("/:id", productController.GetDetailProduct);
router.post("/", adminAuth, upload, productController.InsertProduct); // Integrating cloudinary upload middleware
router.patch("/data/:id", adminAuth, productController.UpdateProductData);
router.patch(
	"/image/:id",
	adminAuth,
	upload,
	productController.UpdateProductImage
);
router.delete("/:id", adminAuth, productController.DeleteProduct);

module.exports = router;
