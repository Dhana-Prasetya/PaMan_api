const commonHelper = require("../helper/common.js");
const { cloudinary } = require("../middleware/cloudinary.js");
const { PrismaClient } = require("@prisma/client");
const {
	PAGINATION_CONSTRAINT,
	ID_CONSTRAINT,
	PRODUCT_CONSTRAINT,
} = require("../config/inputConstraint.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");

const prisma = new PrismaClient();

const productController = {
	// API methods for products
	getProductsPagination: async (req, res) => {
		try {
			let {
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query; // Default pagination values

			// Check if page and limit are integers
			const pageIntCheck = Number.isInteger(page);
			const limitIntCheck = Number.isInteger(limit);

			// ------------------------ Input Validations ----------------------- //

			const errors = {};
			if (page < 1 || !pageIntCheck) {
				errors.page = `Page must be a positive integer between 1 and ${ID_CONSTRAINT.MAX_INT} !`;
			}
			if (
				limit < 1 ||
				limit > PAGINATION_CONSTRAINT.MAX_ITEMS_PER_PAGE ||
				!limitIntCheck
			) {
				errors.limit = `Limit must be a positive integer between 1 and ${PAGINATION_CONSTRAINT.MAX_ITEMS_PER_PAGE} !`;
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const skip = (page - 1) * limit; // Calculate the number of records to skip based of page and limit

			const results = await prisma.products.findMany({
				skip,
				take: limit,
				orderBy: { id: "asc" },
			});

			const total = await prisma.products.count();
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
			const intIdCheck = Number.isInteger(id);

			// ------------------------ Input Validations ----------------------- //

			if (
				!intIdCheck ||
				id < ID_CONSTRAINT.MIN_INT ||
				id > ID_CONSTRAINT.MAX_INT
			) {
				return commonHelper.response(
					res,
					null,
					400,
					`ID need to be a positive integer between 1 and ${ID_CONSTRAINT.MAX_INT} !`
				);
			}

			if (id > ID_CONSTRAINT.MAX_INT) {
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

			const results = await prisma.products.findUnique({
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
			let {
				name,
				stock,
				price,
				description,
				category,
				discounted_price = null,
			} = req.body;

			const intStockCheck = Number.isInteger(Number(stock));
			const intPriceCheck = Number.isInteger(Number(price));

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
				return res.status(400).json({
					message: "All fields are required except ''discounted_price'' !",
				});
			}

			if (!isNaN(name)) {
				// Input validation (client always send as string)
				errors.name = "Name must contain letters !";
			}

			if (!intStockCheck || stock < PRODUCT_CONSTRAINT.MIN_STOCK) {
				// Input validation for stock
				errors.stock = "Stock must be a positive integer or 0 !";
			}

			if (
				!intPriceCheck ||
				price < PRODUCT_CONSTRAINT.MIN_PRICE ||
				price > PRODUCT_CONSTRAINT.MAX_PRICE
			) {
				// Input validation for price
				errors.price = `Price must be between ${PRODUCT_CONSTRAINT.MIN_PRICE} and ${PRODUCT_CONSTRAINT.MAX_PRICE} !`;
			}

			if (!isNaN(description)) {
				// Input validation (client always send as string)
				errors.description = "Description must contain letters !";
			}

			if (!PRODUCT_CONSTRAINT.CATEGORY_ENUM.includes(category)) {
				errors.category =
					"Product category only support ''Beras'', ''Sayur'', or ''Buah''";
			}

			if (discounted_price !== null) {
				// Check 1: Must be a number and an integer
				const isInteger = Number.isInteger(discounted_price);

				// Check 2: Must be non-negative (>= 0)
				const isNonNegative = discounted_price >= PRODUCT_CONSTRAINT.MIN_PRICE;

				// If it's NOT an integer OR it's negative, then it's invalid.
				if (!isInteger || !isNonNegative) {
					errors.discounted_price =
						"Discounted price must be a non-negative integer!";
				}
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

			discounted_price = Number(discounted_price);

			// Raw query to get next value of products_id_seq
			const nextProductIdQuery = await prisma.$queryRaw`
				SELECT last_value FROM products_id_seq;
			`;

			let customPublicId = nextProductIdQuery[0]; // Get the first object from the query result
			customPublicId = customPublicId.last_value; // Extract the last_value property
			customPublicId = Number(customPublicId) + 1; // Increment by 1 to get the next ID value

			customPublicId = `${PRODUCT_CONSTRAINT.FILE_NAME_PREFIX}${customPublicId}`;

			const result = await cloudinary.uploader.upload(req.file.path, {
				public_id: customPublicId,
				folder: PRODUCT_CONSTRAINT.DEFAULT_IMAGE_FOLDER,
			});
			const photo_url = result.secure_url;

			const results = await prisma.products.create({
				data: {
					name,
					stock: Number(stock),
					price: Number(price),
					photo_url,
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

	updateProductData: async (req, res) => {
		// Update by id
		try {
			const id = Number(req.params.id);
			const intIdCheck = Number.isInteger(id);

			// ------------------------ ID Input Validations ----------------------- //

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			if (!intIdCheck || id < ID_CONSTRAINT.MIN_INT) {
				return commonHelper.response(
					res,
					null,
					400,
					`ID need to be a positive integer !`
				);
			}

			if (id > ID_CONSTRAINT.MAX_INT) {
				return commonHelper.response(
					res,
					null,
					400,
					`ID exceeds maximum allowed value !`
				);
			}

			// ------------------------ ID Input Validations ----------------------- //

			const selectedProduct = await prisma.products.findUnique({
				where: {
					id: id,
				},
			});

			if (!selectedProduct) {
				return commonHelper.response(res, null, 404, "Product not found");
			}

			let {
				name,
				stock,
				price,
				description,
				category,
				discounted_price = null,
			} = req.body;

			// ------------------------ Input Validations ----------------------- //

			const errors = {};

			if (!name || !stock || !price || !description || !category) {
				return res.status(400).json({
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

			if (discounted_price !== null) {
				// Check 1: Must be a number and an integer
				const isInteger = Number.isInteger(discounted_price);

				// Check 2: Must be non-negative (>= 0)
				const isNonNegative = discounted_price >= PRODUCT_CONSTRAINT.MIN_PRICE;

				// If it's NOT an integer OR it's negative, then it's invalid.
				if (!isInteger || !isNonNegative) {
					errors.discounted_price =
						"Discounted price must be a non-negative integer!";
				}
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const results = await prisma.products.update({
				// Update product in database
				where: {
					id: id,
				},
				data: {
					name,
					stock: Number(stock),
					price: Number(price),
					description,
					discounted_price,
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

	updateProductImage: async (req, res) => {
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

			if (id > ID_CONSTRAINT.MAX_INT) {
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

			const selectedProduct = await prisma.products.findUnique({
				where: {
					id: id,
				},
			});

			if (selectedProduct === null) {
				return commonHelper.response(res, null, 404, "Product not found");
			}

			const cloudinaryPublicId = getCloudinaryPublicId(
				selectedProduct.photo_url
			); // Extract public ID from URL

			const updatedImage = await cloudinary.uploader.upload(req.file.path, {
				public_id: cloudinaryPublicId, // Same public ID to overwrite existing image
				overwrite: true,
			});

			const photo_url = updatedImage.secure_url; // Get the updated image URL

			const results = await prisma.products.update({
				// Update product in database
				where: {
					id: id,
				},
				data: {
					photo_url,
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
			const intIdCheck = Number.isInteger(id);

			// ------------------------ Input Validations ----------------------- //

			if (!intIdCheck || id < ID_CONSTRAINT.MIN_INT) {
				return commonHelper.response(
					res,
					null,
					400,
					"ID need to be a positive integer !"
				);
			}

			if (id > ID_CONSTRAINT.MAX_INT) {
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

			const cloudinaryUrl = await prisma.products // Get current photo URL from database
				.findUnique({
					where: {
						id: id,
					},
					select: {
						photo_url: true,
					},
				});

			const results = await prisma.products.delete({
				// Delete product from database
				where: {
					id: id,
				},
			});

			const cloudinaryPublicId = getCloudinaryPublicId(cloudinaryUrl.photo_url); // Extract public ID from URL

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
