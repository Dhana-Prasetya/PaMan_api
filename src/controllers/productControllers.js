const commonHelper = require("../helper/common.js");
const { cloudinary } = require("../middleware/cloudinary.js");
const { PrismaClient } = require("@prisma/client");
const {
	paginationConstraint,
	idConstraint,
	productConstraint,
} = require("../config/inputConstraint.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");

const prisma = new PrismaClient();

const productController = {
	// API methods for products
	getProductsPagination: async (req, res) => {
		try {
			let {
				page = paginationConstraint.defaultPagePosition,
				limit = paginationConstraint.defaultItemsPerPage,
			} = req.query; // Default pagination values

			// Convert to number
			page = parseInt(page);
			limit = parseInt(limit);

			// ------------------------ Input Validations ----------------------- //

			const errors = {};
			if (isNaN(page) || page < 1) {
				errors.page = "Page must be a positive integer !";
			}
			if (
				isNaN(limit) ||
				limit < 1 ||
				limit > paginationConstraint.maxItemsPerPage
			) {
				errors.limit = `Limit must be a positive integer between 1 and ${paginationConstraint.maxItemsPerPage} !`;
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const skip = (page - 1) * limit; // Calculate the number of records to skip based of page and limit

			const results = await prisma.product.findMany({
				skip,
				take: limit,
				orderBy: { id: "asc" },
			});

			const total = await prisma.product.count();
			const totalPages = Math.ceil(total / limit);

			const payload = {
				page,
				limit,
				total,
				totalPages,
				results,
			};

			return commonHelper.response(
				res,
				payload,
				200,
				"Getting all products Success"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(
				res,
				null,
				500,
				"Failed to get all products"
			);
		}
	},

	getDetailProduct: async (req, res) => {
		// Get product by param id
		try {
			const id = Number(req.params.id);

			// ------------------------ Input Validations ----------------------- //

			if (isNaN(id) || id <= idConstraint.minInt) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID need to be a positive integer !"
				);
			}

			if (id > idConstraint.maxInt) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID exceeds maximum allowed value !"
				);
			}

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const results = await prisma.product.findUnique({
				where: {
					id: id,
				},
			});

			if (results === null) {
				return commonHelper.response(res, null, 404, "Product not found");
			}

			return commonHelper.response(
				res,
				results,
				200,
				"Get product by id Success"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(
				res,
				null,
				500,
				"Failed to get product by id"
			);
		}
	},

	insertProduct: async (req, res) => {
		// Adding product
		try {
			const {
				name,
				stock,
				price,
				description,
				category,
				discounted_price = null,
			} = req.body;

			// ------------------------ Input Validations ----------------------- //

			const errors = {};

			if (
				req.file === undefined ||
				!name ||
				!stock ||
				!price ||
				!description ||
				!category
			) {
				return res
					.status(400)
					.json({
						message: "All fields are required except ''discounted_price'' !",
					});
			}

			if (!isNaN(name)) {
				// Input validation (client always send as string)
				errors.name = "Name must contain letters !";
			}

			if (isNaN(stock) || stock < productConstraint.minStock) {
				// Input validation for stock
				errors.stock = "Stock must be a positive integer or 0 !";
			}

			if (isNaN(price) || price < productConstraint.minPrice) {
				// Input validation for price
				errors.price = "Price must be a positive integer or 0 !";
			}

			if (price > productConstraint.maxPrice) {
				// Input validation for price
				errors.price = "The price are too expensive !";
			}

			if (!isNaN(description)) {
				// Input validation (client always send as string)
				errors.description = "Description must contain letters !";
			}

			if (!productConstraint.categoryEnum.includes(category)) {
				errors.category =
					"Product category only support ''Beras'', ''Sayur'', or ''Buah''";
			}

			if (
				discounted_price !== null &&
				(isNaN(discounted_price) ||
					discounted_price < productConstraint.minPrice)
			) {
				errors.discounted_price =
					"Discounted price must be a positive integer or 0 !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const productDuplicationCheck = await prisma.products.findUnique({
				where: {
					name: name,
				},
			});

			if (productDuplicationCheck) {
				// Check for duplicate product name
				return commonHelper.response(
					res,
					null,
					500,
					"Product with the same name already exist !"
				);
			}

			let customPublicId = await prisma.products.count(); // Generate custom public ID based on current product count
			customPublicId = `product_${customPublicId + 1}`;

			const result = await cloudinary.uploader.upload(req.file.path, {
				public_id: `${productConstraint.defaultImageFolder}${customPublicId}`,
			});
			const photo = result.secure_url;

			const results = await prisma.products.create({
				data: {
					name,
					stock: Number(stock),
					price: Number(price),
					photo,
					description,
					category,
					discounted_price,
				},
			});

			return commonHelper.response(
				res,
				results,
				201,
				"Product successfully created"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Failed to create product");
		}
	},

	updateProductPartial: async (req, res) => {
		// Update by id
		try {
			const id = Number(req.params.id);

			// ------------------------ ID Input Validations ----------------------- //

			if (isNaN(id) || id <= 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID need to be a positive integer !"
				);
			}

			if (id > idConstraint.maxInt) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID exceeds maximum allowed value !"
				);
			}

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			// ------------------------ ID Input Validations ----------------------- //

			const selectedProduct = await prisma.product.findUnique({
				where: {
					id: id,
				},
			});

			if (selectedProduct === null) {
				return commonHelper.response(res, null, 404, "Product not found");
			}

			const {
				name,
				stock,
				price,
				description,
				category,
				discounted_price = null,
			} = req.body;

			// ------------------------ Input Validations ----------------------- //

			const errors = {};

			if (
				req.file === undefined ||
				!name ||
				!stock ||
				!price ||
				!description ||
				!category
			) {
				return res
					.status(400)
					.json({
						message: "All fields are required except ''discounted_price'' !",
					});
			}

			if (!isNaN(name)) {
				// Input validation (client always send as string)
				errors.name = "Name must contain letters !";
			}

			if (isNaN(stock)) {
				// Input validation (client always send as string)
				errors.stock = "Stock must be a positive integer or 0 !";
			}

			if (isNaN(price)) {
				// Input validation (client always send as string)
				errors.price = "Price must be a positive integer or 0 !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const cloudinaryPublicId = getCloudinaryPublicId(selectedProduct.photo); // Extract public ID from URL

			const updatedImage = await cloudinary.uploader.upload(req.file.path, {
				public_id: cloudinaryPublicId, // Same public ID to overwrite existing image
				overwrite: true,
			});

			const photo = updatedImage.secure_url; // Get the updated image URL

			const results = await prisma.product.update({
				// Update product in database
				where: {
					id: id,
				},
				data: {
					name,
					stock: Number(stock),
					price: Number(price),
					photo,
					description,
				},
			});

			return commonHelper.response(
				res,
				results,
				200,
				"Product successfully updated"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Failed to update product");
		}
	},

	deleteProduct: async (req, res) => {
		// Delete product by id
		try {
			const id = Number(req.params.id);

			// ------------------------ Input Validations ----------------------- //

			if (isNaN(id) || id <= 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID need to be a positive integer !"
				);
			}

			if (id > idConstraint.maxInt) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID exceeds maximum allowed value !"
				);
			}

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const cloudinaryUrl = await prisma.product // Get current photo URL from database
				.findUnique({
					where: {
						id: id,
					},
					select: {
						photo: true,
					},
				});

			const results = await prisma.product.delete({
				// Delete product from database
				where: {
					id: id,
				},
			});

			const cloudinaryPublicId = getCloudinaryPublicId(cloudinaryUrl.photo); // Extract public ID from URL

			if (cloudinaryPublicId) {
				await cloudinary.uploader.destroy(cloudinaryPublicId);
			}

			return commonHelper.response(
				res,
				results,
				200,
				"Product successfully deleted"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Failed to delete product");
		}
	},
};

module.exports = productController;
