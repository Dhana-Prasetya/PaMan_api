const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers.js");
const { protect } = require("../middleware/auth.js"); // Import the protect (jwt token) middleware
const { upload } = require("../middleware/upload.js");

router.get("/", productController.getProductsPagination);
router.get("/:id", productController.getDetailProduct);
router.post("/", upload, productController.insertProduct); // Integrating cloudinary upload middleware
router.patch("/:id", upload, productController.updateProductPartial);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
