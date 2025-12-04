const commonHelper = require("../helper/common.js");
const { cloudinary } = require("../middleware/cloudinary.js");
const { PrismaClient } = require("@prisma/client");
const {
	PAGINATION_CONSTRAINT,
	ID_CONSTRAINT,
	PRODUCT_CONSTRAINT,
} = require("../config/inputConstraint.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");
const productIdCheck = require("../helper/productIdCheck.js");
const productInputCheck = require("../helper/productInputCheck.js");
const adminAuthCheck = require("../helper/adminAuthCheck.js");
const paginationCheck = require("../helper/paginationCheck.js");
const inputConstraint = require("../config/inputConstraint.js");
const capitalizeFirstLetter = require("../helper/capitalizeFirstLetter.js");
const pagination = require("../helper/pagination.js");

const prisma = new PrismaClient();

const productController = {
	// API methods for products
	GetProductsPagination: async (req, res) => {
		try {
			let {
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query; // Default pagination values

			page = Number(page); // Convert to Number
			limit = Number(limit);

			// ------------------------ Input Validations ----------------------- //

			let errors = {};
			errors = paginationCheck(page, limit);

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const { skip, total, totalPages } = await pagination({ page, limit });

			const results = await prisma.products.findMany({
				skip,
				take: limit,
				orderBy: { id: "asc" },
			});

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

	GetDetailProduct: async (req, res) => {
		// Get product by param id
		try {
			const id = Number(req.params.id);

			// ------------------------ Input Validations ----------------------- //

			let idErrors = productIdCheck(id);

			console.log(idErrors);

			if (idErrors !== false) {
				return commonHelper.response(res, null, 400, idErrors);
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

	InsertProduct: async (req, res) => {
		// Adding product
		try {
			const isAdminValidated = await adminAuthCheck(req.admin.id); // Boolean check if admin id from adminAuth middleware is valid

			if (!isAdminValidated) {
				return commonHelper.response(res, null, 403, "Unauthorized access");
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

			let errors = {};

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

			category = capitalizeFirstLetter(category); // Capitalize input first letter to match enum values

			errors = await productInputCheck({
				name,
				stock,
				price,
				description,
				category,
				discounted_price,
			});

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

			if (discounted_price) {
				// If discounted_price provided, convert to Number
				discounted_price = Number(discounted_price);
			}

			// Raw query to get next value of products_id_seq
			const nextProductIdQuery = await prisma.$queryRaw`
				SELECT last_value FROM products_id_seq;
			`;

			let customPublicId = nextProductIdQuery[0]; // Get the first object from the query result
			customPublicId = customPublicId.last_value; // Extract the last_value property
			customPublicId = Number(customPublicId); // Convert to Number

			console.log("Next Product ID:", customPublicId);

			if (customPublicId > ID_CONSTRAINT.MIN_INT) {
				// If not first entry,  increment by 1
				customPublicId = customPublicId + 1; // Increment by 1 to get the next ID value
			}

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

	UpdateProductData: async (req, res) => {
		// Update by id
		try {
			const isAdminValidated = await adminAuthCheck(req.admin.id); // Boolean check if admin id from adminAuth middleware is valid

			if (!isAdminValidated) {
				return commonHelper.response(res, null, 403, "Unauthorized access");
			}

			const id = Number(req.params.id);

			// ------------------------ ID Input Validations ----------------------- //

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			let idErrors = productIdCheck(id);

			if (idErrors > 0) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, "Invalid product ID !");
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

			let errors = {};

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

			category = capitalizeFirstLetter(category); // Capitalize input first letter to match enum values

			errors = await productInputCheck({
				name,
				stock,
				price,
				description,
				category,
				discounted_price,
			});

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			if (discounted_price) {
				// If discounted_price provided, convert to Number
				discounted_price = Number(discounted_price);
			}

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

	UpdateProductImage: async (req, res) => {
		// Update by id
		try {
			const isAdminValidated = await adminAuthCheck(req.admin.id); // Boolean check if admin id from adminAuth middleware is valid

			if (!isAdminValidated) {
				return commonHelper.response(res, null, 403, "Unauthorized access");
			}

			const id = Number(req.params.id);

			// ------------------------ ID Input Validations ----------------------- //

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			let idErrors = productIdCheck(id);

			if (idErrors > 0) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, "Invalid product ID !");
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

	DeleteProduct: async (req, res) => {
		// Delete product by id
		try {
			const isAdminValidated = await adminAuthCheck(req.admin.id); // Boolean check if admin id from adminAuth middleware is valid

			if (!isAdminValidated) {
				return commonHelper.response(res, null, 403, "Unauthorized access");
			}

			const id = Number(req.params.id);

			// ------------------------ Input Validations ----------------------- //

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			let idErrors = productIdCheck(id);

			if (idErrors > 0) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, "Invalid product ID !");
			}

			// ------------------------ Input Validations ----------------------- //

			const dataInDb = await prisma.products // Get current photo URL from database
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

			const cloudinaryPublicId = getCloudinaryPublicId(dataInDb.photo_url); // Extract public ID from URL

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

	SearchProductByNamePaginated: async (req, res) => {
		try {
			let {
				product,
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			// ------------------------ Input Validations ----------------------- //

			page = Number(page);
			limit = Number(limit);

			let errors = {};
			errors = paginationCheck(page, limit);

			if (!isNaN(product)) {
				// Input validation (client always send as string)
				errors.product = "Product name must contain letters !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const { skip, total, totalPages } = await pagination({ page, limit });

			const productSentence = product.replace(/\d/g, ""); // Remove digits from search query (for broader search)

			const searchResults = await prisma.products.findMany({
				where: {
					name: {
						contains: productSentence,
						mode: "insensitive", // search to ignore case
					},
					// condition: stock must be greater than 0
					stock: {
						gt: 0, // 'gt' stands for Greater Than
					},
				},
				select: {
					id: true,
					photo_url: true,
					name: true,
					description: true,
					price: true,
					discounted_price: true,
				},
				skip,
				take: limit,
				orderBy: { id: "asc" },
			});

			const payload = {
				page,
				limit,
				total,
				totalPages,
				searchResults,
			};

			return commonHelper.response(
				res,
				payload,
				200,
				"Product search successful"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	AdminSortedProducts: async (req, res) => {
		try {
			const isAdminValidated = await adminAuthCheck(req.admin.id); // Boolean check if admin id from adminAuth middleware is valid

			if (!isAdminValidated) {
				return commonHelper.response(res, null, 403, "Unauthorized access");
			}

			const isEmpty = await prisma.products.count(); // If no products in database, return 404
			if (isEmpty < 1) {
				return commonHelper.response(res, null, 404, "No products in database");
			}

			let {
				sort,
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			sort = capitalizeFirstLetter(sort); // Capitalize input first letter to match enum values

			// ------------------------ Input Validations ----------------------- //

			page = Number(page);
			limit = Number(limit);

			let errors = {};
			errors = paginationCheck(page, limit);

			if (!sort || !isNaN(sort)) {
				errors.sort = "Sort field is required and must contain letters !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			let sortResults = null;

			const { skip, total, totalPages } = await pagination({ page, limit });

			if (PRODUCT_CONSTRAINT.CATEGORY_ENUM.includes(sort)) {
				sortResults = await prisma.products.findMany({
					where: {
						category: sort,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});
			} else if (sort === inputConstraint.PRODUCT_CONSTRAINT.IN_STOCK) {
				sortResults = await prisma.products.findMany({
					where: {
						stock: { gt: 0 },
					},
					orderBy: { id: "asc" },
				});
			} else if (sort === inputConstraint.PRODUCT_CONSTRAINT.OUT_OF_STOCK) {
				sortResults = await prisma.products.findMany({
					where: {
						stock: { lt: 1 },
					},
					orderBy: { id: "asc" },
				});
			}

			const emptyData = Object.keys(sortResults); // Check if the result is empty

			if (emptyData.length === 0) {
				return commonHelper.response(
					res,
					null,
					404,
					`No products found in category '${sort}' !`
				);
			}

			const payload = {
				page,
				limit,
				total,
				totalPages,
				sortResults,
			};

			if (sortResults !== null) {
				return commonHelper.response(
					res,
					payload,
					200,
					`Products sorted by '${sort}' status !`
				);
			} else {
				return commonHelper.response(
					res,
					null,
					400,
					"Invalid sort option ! Available sort options: 'beras', 'buah', 'sayur', 'in-stock' or 'out-of-stock'."
				);
			}
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = productController;
