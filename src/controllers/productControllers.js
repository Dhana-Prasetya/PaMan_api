const commonHelper = require("../helper/common.js");
const { cloudinary } = require("../middleware/cloudinary.js");
const { PrismaClient, Prisma } = require("@prisma/client");
const {
	PAGINATION_CONSTRAINT,
	ID_CONSTRAINT,
	PRODUCT_CONSTRAINT,
} = require("../config/inputConstraint.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");
const productIdCheck = require("../helper/serial-id-check.js");
const productInputCheck = require("../helper/productInputCheck.js");
const paginationCheck = require("../helper/paginationCheck.js");
const inputConstraint = require("../config/inputConstraint.js");
const capitalizeFirstLetter = require("../helper/capitalizeFirstLetter.js");
const pagination = require("../helper/pagination.js");
const serialIdCheck = require("../helper/serial-id-check.js");
const removeNullProperties = require("../helper/removeNullProperties.js");

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

			let paginationErrors = {};
			paginationErrors = paginationCheck(page, limit);

			if (Object.keys(paginationErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ paginationErrors });
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
			console.error(`\n${error}\n`);
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
			let id = req.params.id;
			let {
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			id = Number(id);

			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return res.status(400).json({ idCheck });
			}

			page = Number(page);
			limit = Number(limit);

			const paginationErrors = paginationCheck(page, limit);
			if (Object.keys(paginationErrors).length > 0) {
				return commonHelper.response(res, null, 400, paginationErrors);
			}

			// ------------------------ Input Validations ----------------------- //
			// ------------------------ Pagination logic ------------------------ //
			const skip = (page - 1) * limit; // Calculate the number of records to skip based of page and limit
			const total = await prisma.product_review.count({
				where: { product_id: id },
			});
			const totalPages = Math.ceil(total / limit);

			// ------------------------ Pagination logic ------------------------ //

			const results = await prisma.products.findUnique({
				where: { id: id },
				select: {
					name: true,
					price: true,
					discounted_price: true,
					stock: true,
					photo_url: true,
					description: true,
					total_reviews: true,
					average_rating: true,
					product_review: {
						// --- PAGINATION INSIDE RELATION ---
						skip: skip,
						take: limit,
						orderBy: { id: "desc" },
						// ----------------------------------
						select: {
							id: true,
							review: true,
							rating: true,
							helpful: true,
							users: {
								select: {
									username: true,
									avatar_url: true,
								},
							},
						},
					},
				},
			});

			if (results === null) {
				return commonHelper.response(res, null, 404, "Product not found");
			}

			return commonHelper.response(
				res,
				{
					product: results,
					reviews_pagination: {
						totalReviews: total,
						totalPages: totalPages,
						currentPage: page,
						limit: limit,
					},
				},
				200,
				"Product reviews fetched successfully!"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
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
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
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

			let productInputErrors = {};

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

			productInputErrors = await productInputCheck({
				name,
				stock,
				price,
				description,
				category,
				discounted_price,
			});

			if (Object.keys(productInputErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ productInputErrors });
			}

			// ------------------------ Input Validations ----------------------- //

			const insertProductTransaction = await prisma.$transaction(
				async (tx) => {
					const productDuplicationCheck = await tx.products.findUnique({
						where: {
							name: name,
						},
						relationLoadStrategy: "join",
					});

					if (productDuplicationCheck) {
						// Check for duplicate product name
						throw new Error("DUPLICATE_PRODUCT_NAME");
					}

					if (discounted_price) {
						// If discounted_price provided, convert to Number
						discounted_price = Number(discounted_price);
					}

					// Raw query to get next value of products_id_seq
					const nextProductIdQuery = await tx.$queryRaw`
						SELECT last_value FROM products_id_seq;
					`;

					let customPublicId = nextProductIdQuery[0]; // Get the first object from the query result
					customPublicId = customPublicId.last_value; // Extract the last_value property
					customPublicId = Number(customPublicId); // Convert to Number

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

					const results = await tx.products.create({
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

					return results;
				},
				{
					transactionOptions: {
						isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
						setTimeout: 10000,
					},
				}
			);

			return commonHelper.response(
				res,
				insertProductTransaction,
				201,
				"Product successfully created"
			);
		} catch (error) {
			if (error.message === "DUPLICATE_PRODUCT_NAME") {
				return commonHelper.response(
					res,
					null,
					400,
					"Product with the same name already exist !"
				);
			} else {
				console.error(`\n${error}\n`);
				return commonHelper.response(
					res,
					null,
					500,
					"Failed to create product"
				);
			}
		}
	},

	UpdateProductData: async (req, res) => {
		// Update by id
		try {
			// ------------------------ ID Input Validations ----------------------- //

			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}

			const id = Number(req.params.id);

			let productIdErrors = {};

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			productIdErrors = productIdCheck(id);

			if (Object.keys(productIdErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ productIdErrors });
			}

			// ------------------------ Input Validations ----------------------- //

			let {
				name = null,
				stock = null,
				price = null,
				description = null,
				category = null,
				discounted_price = null,
			} = req.body;

			if (
				!name &&
				!stock &&
				!price &&
				!description &&
				!category &&
				!discounted_price
			) {
				return res.status(400).json({
					message: "Atleast one field to update is required !",
				});
			}

			category = capitalizeFirstLetter(category); // Capitalize input first letter to match enum values

			let productInputErrors = {};

			productInputErrors = await productInputCheck({
				name,
				stock,
				price,
				description,
				category,
				discounted_price,
			});

			if (Object.keys(productInputErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ productInputErrors });
			}

			if (stock) {
				// Convert to Number if provided
				stock = Number(stock);
			}
			if (price) {
				price = Number(price);
			}
			if (discounted_price) {
				discounted_price = Number(discounted_price);
			}

			// ------------------------ Input Validations ----------------------- //

			const updateProductTransaction = await prisma.$transaction(
				async (tx) => {
					if (name) {
						// Check for name duplication only if name is provided
						const productDuplicationCheck = await tx.products.findUnique({
							// Check for duplicate name excluding current product
							where: {
								name: name,
								NOT: { id: id }, // Exclude current product ID from duplication check
							},
							select: { id: true },
							relationLoadStrategy: "join",
						});

						if (productDuplicationCheck) {
							// Check for duplicate product name
							throw new Error("SAME_NAME_PRODUCT_FOUND");
						}
					}

					let dataToUpdate = {
						name,
						stock,
						price,
						description,
						discounted_price,
					};

					// If these data provided, add to data object
					if (name != null) dataToUpdate.name = name;
					if (stock != null) dataToUpdate.stock = stock;
					if (price != null) dataToUpdate.price = price;
					if (description != null) dataToUpdate.description = description;
					if (discounted_price != null)
						dataToUpdate.discounted_price = discounted_price;

					dataToUpdate = removeNullProperties(dataToUpdate); // Remove null properties from data object

					const updatedData = await tx.products.update({
						// Update product in database with discounted_price
						where: {
							id: id,
						},
						data: dataToUpdate,
					});

					return updatedData;
				},
				{
					transactionOptions: {
						isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
						setTimeout: 10000,
					},
				}
			);

			return commonHelper.response(
				// Return succeed response
				res,
				updateProductTransaction, // Use the data returned from the transaction
				200,
				"Product successfully updated"
			);
		} catch (error) {
			if (error.message === "SAME_NAME_PRODUCT_FOUND") {
				return commonHelper.response(
					res,
					null,
					409,
					"Product with the same name already exist !"
				);
			} else if (error.code === "P2025") {
				// Prisma record not found error code
				return commonHelper.response(
					res,
					null,
					404,
					"Product not found, failed to update product"
				);
			} else {
				console.error(`\n${error}\n`);
				return commonHelper.response(
					res,
					null,
					500,
					"Failed to update product"
				);
			}
		}
	},

	UpdateProductImage: async (req, res) => {
		// Update by id
		try {
			let id = req.params.id;

			// ------------------------ ID Input Validations ----------------------- //

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			id = Number(id);

			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return res.status(400).json({ idCheck });
			}

			// ------------------------ ID Input Validations ----------------------- //

			const updatingProductImage = await prisma.$transaction(
				async (tx) => {
					const selectedProduct = await tx.products.findUnique({
						where: {
							id: id,
						},
						select: { photo_url: true },
						relationLoadStrategy: "join",
					});

					if (selectedProduct === null) {
						throw new Error("PRODUCT_NOT_FOUND");
					}

					const cloudinaryPublicId = getCloudinaryPublicId(
						selectedProduct.photo_url
					); // Extract public ID from URL

					const updatedImage = await cloudinary.uploader.upload(req.file.path, {
						public_id: cloudinaryPublicId, // Same public ID to overwrite existing image
						overwrite: true,
					});

					const photo_url = updatedImage.secure_url; // Get the updated image URL

					const results = await tx.products.update({
						// Update product in database
						where: {
							id: id,
						},
						data: {
							photo_url,
						},
					});

					return results;
				},

				{
					transactionOptions: {
						isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
						setTimeout: 10000,
					},
				}
			);

			return commonHelper.response(
				res,
				updatingProductImage,
				200,
				"Product successfully updated"
			);
		} catch (error) {
			if (error.message === "PRODUCT_NOT_FOUND") {
				return commonHelper.response(res, null, 404, "Product not found");
			} else {
				console.error(`\n${error}\n`);
				return commonHelper.response(
					res,
					null,
					500,
					"Failed to update product"
				);
			}
		}
	},

	DeleteProduct: async (req, res) => {
		// Delete product by id
		try {
			const id = Number(req.params.id);

			// ------------------------ Input Validations ----------------------- //

			let productIdErrors = {};

			if (!id) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product ID is required !"
				);
			}

			productIdErrors = productIdCheck(id);

			if (Object.keys(productIdErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ productIdErrors });
			}

			// ------------------------ Input Validations ----------------------- //

			const productDeletion = await prisma.$transaction(
				async (tx) => {
					const dataInDb = await tx.products // Get current photo URL from database
						.findUnique({
							where: {
								id: id,
							},
							select: {
								id: true,
								name: true,
								category: true,
								photo_url: true,
							},
							relationLoadStrategy: "join",
						});

					const results = await tx.products.delete({
						// Delete product from database
						where: {
							id: id,
						},
					});

					const cloudinaryPublicId = getCloudinaryPublicId(dataInDb.photo_url); // Extract public ID from URL

					if (cloudinaryPublicId) {
						await cloudinary.uploader.destroy(cloudinaryPublicId);
					}

					return results; // Return deleted product data to 'productDeletion'
				},
				{
					transactionOptions: {
						isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
						setTimeout: 10000,
					},
				}
			);

			return commonHelper.response(
				res,
				productDeletion,
				200,
				"Product successfully deleted"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
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

			let paginationErrors = {};
			paginationErrors = paginationCheck(page, limit);

			if (!isNaN(product)) {
				// Input validation (client always send as string)
				paginationErrors.product = "Product name must contain letters !";
			}

			if (Object.keys(paginationErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ paginationErrors });
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
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	AdminSortedProducts: async (req, res) => {
		try {
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

			if (!sort || !isNaN(sort)) {
				commonHelper.response(
					res,
					null,
					400,
					"Sort parameter is required and must contain letters ! Available sort options: 'beras', 'buah', 'sayur', 'in-stock' or 'out-of-stock'."
				);
			}

			page = Number(page);
			limit = Number(limit);

			let paginationErrors = {};
			paginationErrors = paginationCheck(page, limit);

			if (Object.keys(paginationErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ paginationErrors });
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
			} else {
				return commonHelper.response(
					res,
					null,
					400,
					"Invalid sort option ! Available sort options: 'beras', 'buah', 'sayur', 'in-stock' or 'out-of-stock'."
				);
			}

			const emptyData = Object.keys(sortResults); // Check if the result is empty

			if (emptyData.length === 0) {
				return commonHelper.response(
					res,
					null,
					200,
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
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = productController;
