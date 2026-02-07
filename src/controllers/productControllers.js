const commonHelper = require("../helper/common.js");
const { cloudinary } = require("../middleware/cloudinary.js");
const { PrismaClient, Prisma } = require("@prisma/client");
const redisClient = require("../helper/redisClient.js");
const {
	invalidateProductPaginationCache,
} = require("../helper/cacheInvalidation.js");
const {
	PAGINATION_CONSTRAINT,
	PRODUCT_CONSTRAINT,
} = require("../config/inputConstraint.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");
const productIdCheck = require("../helper/serial-id-check.js");
const productInputCheck = require("../helper/productInputCheck.js");
const paginationCheck = require("../helper/paginationCheck.js");
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

			// ------------------------ Caching ----------------------- //

			// Create a cache key based on page and limit
			const cacheKey = `page:limit:${page}:${limit}`;

			// Try to get from Redis cache
			const cachedData = await redisClient.get(cacheKey);
			if (cachedData) {
				// If cache exists, return cached data
				return commonHelper.response(
					res,
					JSON.parse(cachedData), // Parse cached JSON string back to object
					200,
					"Getting all products Success from cache !",
				);
			}

			// ------------------------ Caching ----------------------- //

			const { skip, total, totalPages } = await pagination({
				page,
				limit,
				table: "products",
			});

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

			// Store in Redis cache with 1 hour expiration (3600 seconds)
			await redisClient.setEx(cacheKey, 3600, JSON.stringify(payload));

			return commonHelper.response(
				res,
				payload,
				200,
				"Getting all products Success",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(
				res,
				null,
				500,
				"Failed to get all products",
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

			id = Number(id);
			page = Number(page);
			limit = Number(limit);

			// ------------------------ Pagination logic ------------------------ //

			const { skip, total, totalPages } = await pagination({
				page,
				limit,
				table: "product_review",
			});

			// ------------------------ Pagination logic ------------------------ //

			// ------------------------ Caching ----------------------- //

			// Create a cache key based on page and limit
			const cacheKey = `id:page:limit:${id}:${page}:${limit}`;

			// Try to get from Redis cache
			const cachedData = await redisClient.get(cacheKey);
			if (cachedData) {
				// If cache exists, return cached data
				return commonHelper.response(
					res,
					JSON.parse(cachedData), // Parse cached JSON string back to object
					200,
					"Getting all products Success from cache !",
				);
			}

			// ------------------------ Caching ----------------------- //

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

			const payload = {
				product: results,
				reviews_pagination: {
					totalReviews: total,
					totalPages: totalPages,
					currentPage: page,
					limit: limit,
				},
			};

			// Store in Redis cache with 1 hour expiration (3600 seconds)
			await redisClient.setEx(cacheKey, 3600, JSON.stringify(payload));

			return commonHelper.response(
				res,
				payload,
				200,
				"Product reviews fetched successfully!",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(
				res,
				null,
				500,
				"Failed to get product by id",
			);
		}
	},

	InsertProduct: async (req, res) => {
		// Adding product
		let productPhotoURL = null;

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

			productInputErrors = productInputCheck({
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
					if (discounted_price) {
						// If discounted_price provided, convert to Number
						discounted_price = Number(discounted_price);
					}

					const createProduct = await tx.products.create({
						data: {
							name,
							stock: Number(stock),
							price: Number(price),
							photo_url: "-placeholder-",
							description,
							category,
							discounted_price,
						},
					});

					const customPublicId = `${PRODUCT_CONSTRAINT.FILE_NAME_PREFIX}${createProduct.id}`; // Custom public ID for Cloudinary

					const productImageConfig = await cloudinary.uploader.upload(
						req.file.path,
						{
							//  Custom folder and public_id
							public_id: customPublicId,
							folder: PRODUCT_CONSTRAINT.DEFAULT_IMAGE_FOLDER,
						},
					);
					productPhotoURL = productImageConfig.secure_url; // Get uploaded image URL

					const results = await tx.products.update({
						where: {
							id: createProduct.id,
						},
						data: {
							photo_url: productPhotoURL,
						},
					});

					return results;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
					setTimeout: 8000,
				},
			);

			// Invalidate cache after successful product creation
			await invalidateProductPaginationCache();

			return commonHelper.response(
				res,
				insertProductTransaction,
				201,
				"Product successfully created",
			);
		} catch (error) {
			if (productPhotoURL) {
				// If product photo was uploaded before transaction failed, delete it
				const cloudinaryPublicId = getCloudinaryPublicId(productPhotoURL);
				await cloudinary.uploader.destroy(cloudinaryPublicId); // Delete uploaded image if transaction fails
			}

			if (error.code === "P2002") {
				return commonHelper.response(
					res,
					null,
					400,
					"Product with the same name already exist !",
				);
			}

			console.error(`\n${error}\n`);

			return commonHelper.response(res, null, 500, "Failed to create product");
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

			productInputErrors = productInputCheck({
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

			const updatedData = await prisma.products.update({
				// Update product in database with discounted_price
				where: {
					id: id,
				},
				data: dataToUpdate,
			});

			// Invalidate cache after successful product update
			await invalidateProductPaginationCache();

			return commonHelper.response(
				// Return succeed response
				res,
				updatedData, // Use the data returned from the update
				200,
				"Product successfully updated",
			);
		} catch (error) {
			if (error.code === "P2002") {
				return commonHelper.response(
					res,
					null,
					409,
					"Product with the same name already exist !",
				);
			} else if (error.code === "P2025") {
				// Prisma record not found error code
				return commonHelper.response(
					res,
					null,
					404,
					"Product not found, failed to update product",
				);
			} else {
				console.error(`\n${error}\n`);
				return commonHelper.response(
					res,
					null,
					500,
					"Failed to update product",
				);
			}
		}
	},

	UpdateProductImage: async (req, res) => {
		// Update by id
		let productPhotoURL = null;

		try {
			let id = req.params.id;

			id = Number(id);

			const updatingProductImage = await prisma.$transaction(
				async (tx) => {
					const cloudinaryPublicId = getCloudinaryPublicId(
						selectedProduct.photo_url,
					); // Extract public ID from URL

					const updatedImage = await cloudinary.uploader.upload(req.file.path, {
						public_id: cloudinaryPublicId, // Same public ID to overwrite existing image
						overwrite: true,
					});

					productPhotoURL = updatedImage.secure_url; // Get the updated image URL

					const results = await tx.products.update({
						// Update product in database
						where: {
							id: id,
						},
						data: {
							photo_url: productPhotoURL,
						},
					});

					return results;
				},

				{
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
					setTimeout: 12000,
				},
			);

			return commonHelper.response(
				res,
				updatingProductImage,
				200,
				"Product successfully updated",
			);
		} catch (error) {
			if (productPhotoURL) {
				// If product photo was uploaded before transaction failed, delete it
				const cloudinaryPublicId = getCloudinaryPublicId(productPhotoURL);
				await cloudinary.uploader.destroy(cloudinaryPublicId); // Delete uploaded image if transaction fails
			}
			if (error.code === "P2025") {
				return commonHelper.response(res, null, 404, "Product not found");
			}
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Failed to update product");
		}
	},

	DeleteProduct: async (req, res) => {
		// Cannot delete product that has been ordered by user
		// Delete product by id
		try {
			const id = Number(req.params.id);

			const productDeletion = await prisma.$transaction(
				async (tx) => {
					const dataInDb = await tx.products // Get current photo URL from database
						.findUnique({
							where: {
								id: id,
							},
							select: {
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
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
					setTimeout: 12000,
				},
			);

			// Invalidate cache after successful product deletion
			await invalidateProductPaginationCache();

			return commonHelper.response(
				res,
				productDeletion,
				200,
				"Product successfully deleted",
			);
		} catch (error) {
			if (error.code === "P2025") {
				return commonHelper.response(res, null, 404, "Product not found");
			}
			if (error.code === "P2003") {
				return commonHelper.response(
					res,
					null,
					400,
					"Cannot delete a product that has been ordered by user!",
				);
			}
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

			if (!isNaN(product)) {
				// Input validation (client always send as string)
				paginationErrors.product = "Product name must contain letters !";
			}

			// ------------------------ Input Validations ----------------------- //

			const { skip, total, totalPages } = await pagination({
				page,
				limit,
				table: "products",
			});

			const productSentence = product.replace(/\d/g, ""); // Remove digits from search query (for broader search)

			const searchResults = await prisma.products.findMany({
				where: {
					name: {
						contains: productSentence,
						mode: "insensitive", // search to ignore case
					},
					// condition: stock must be greater than 0
				},
				select: {
					id: true,
					photo_url: true,
					name: true,
					description: true,
					price: true,
					discounted_price: true,
					stock: true,
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
				"Product search successful",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	SortedProducts: async (req, res) => {
		try {
			let {
				sort,
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			sort = capitalizeFirstLetter(sort); // Capitalize input first letter to match enum values
			page = Number(page);
			limit = Number(limit);

			// ------------------------ Input Validations ----------------------- //

			if (!sort || !isNaN(sort)) {
				commonHelper.response(
					res,
					null,
					400,
					"Sort parameter is required and must contain letters ! Available sort options: 'beras', 'buah', 'sayur', 'in-stock' or 'out-of-stock'.",
				);
			}

			// ------------------------ Input Validations ----------------------- //

			let results = null;

			const { skip, total, totalPages } = await pagination({
				page,
				limit,
				table: "products",
			});

			if (PRODUCT_CONSTRAINT.CATEGORY_ENUM.includes(sort)) {
				// If sort is a valid category of products
				results = await prisma.products.findMany({
					where: {
						category: sort,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});
			} else if (sort === PRODUCT_CONSTRAINT.IN_STOCK) {
				results = await prisma.products.findMany({
					where: {
						stock: { gt: 0 },
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});
			} else if (sort === PRODUCT_CONSTRAINT.OUT_OF_STOCK) {
				results = await prisma.products.findMany({
					where: {
						stock: { lt: 1 },
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});
			} else {
				return commonHelper.response(
					res,
					null,
					400,
					"Invalid sort option ! Available sort options: 'beras', 'buah', 'sayur', 'in-stock' or 'out-of-stock'.",
				);
			}

			const emptyData = Object.keys(results); // Check if the result is empty

			if (emptyData.length === 0) {
				return commonHelper.response(
					res,
					null,
					200,
					`No products found in category '${sort}' !`,
				);
			}

			const payload = {
				page,
				limit,
				total,
				totalPages,
				results,
			};

			if (results !== null) {
				return commonHelper.response(
					res,
					payload,
					200,
					`Products sorted by '${sort}' status !`,
				);
			} else {
				return commonHelper.response(
					res,
					null,
					400,
					"Invalid sort option ! Available sort options: 'beras', 'buah', 'sayur', 'in-stock' or 'out-of-stock'.",
				);
			}
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = productController;
