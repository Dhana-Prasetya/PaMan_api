const { generateToken } = require("../helper/auth");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const zodValidator = require("zod");
const { PrismaClient, Prisma } = require("@prisma/client");
const {
	STRING_CONSTRAINT,
	PAGINATION_CONSTRAINT,
	ORDER_CONSTRAINT,
} = require("../config/inputConstraint.js");
const serialIdCheck = require("../helper/serial-id-check.js");
const pagination = require("../helper/pagination.js");
const {
	invalidateProductPaginationCache,
} = require("../helper/cacheInvalidation.js");
const { v4: uuidv4 } = require("uuid"); // For generating unique token identifiers
const redisClient = require("../helper/redisClient.js");
const getRemainingTokenLifetime = require("../helper/getRemainingTokenLifetime.js");

const prisma = new PrismaClient();

const adminController = {
	Login: async (req, res, next) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}
			let { email, password } = req.body; // Take email and password from client

			// ------------------------ Input Validations ----------------------- //

			if (!email || !password) {
				return res
					.status(400)
					.json({ message: "Email and password are required !" });
			}

			const emailCheck = zodValidator.string().email(); // Email input validator
			if (!emailCheck.safeParse(email).success) {
				return res.status(400).json({ message: "Email are not valid !" });
			}

			if (
				// Input length validator
				email.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				password.length > STRING_CONSTRAINT.MAX_VARCHAR
			) {
				return res
					.status(400)
					.json({ message: "Email or password are too long !" });
			}

			// ------------------------ Input Validations ----------------------- //

			email = email.toLowerCase();

			const dataInDb = await prisma.admin.findUnique({
				where: {
					email: email,
				},
				select: {
					id: true,
					username: true,
					email: true,
					password: true,
					role: true,
					avatar_url: true,
				},
				relationLoadStrategy: "join",
			});

			if (!dataInDb) {
				// Validating email
				return commonHelper.response(
					res,
					null,
					401,
					"Invalid password or email !",
				);
			}

			const isValidate = await bcrypt.compare(password, dataInDb.password); // Comparing body password with password from 'findEmail'
			if (!isValidate) {
				// Validating password and email
				return commonHelper.response(
					res,
					null,
					401,
					"Invalid password or email !",
				);
			}

			delete dataInDb.password; // Delete user password for confidentiality
			delete req.body.password;

			const payload = {
				// Make payload for JWT
				id: dataInDb.id,
				email: dataInDb.email,
				role: dataInDb.role,
				jti: uuidv4(), // Unique identifier for the token
			};

			dataInDb.token = generateToken(payload); // Create token and add to dataInDb object

			return commonHelper.response(res, dataInDb, 201, "Login success");
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	Logout: async (req, res, next) => {
		try {
			const remainingTokenLife = getRemainingTokenLifetime(req.token);

			if (remainingTokenLife <= 0) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !",
				);
			}

			const blacklistToken = await redisClient.set(
				`revoked:${req.admin.jti}`, // Blacklist cache key
				remainingTokenLife, // Redis TTL in seconds
				JSON.stringify(req.admin),
			);

			if (!blacklistToken) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !",
				);
			}
			return commonHelper.response(
				res,
				null,
				200,
				"Logout success, please delete admin token from browser local storage !",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	ListOfEveryUserPaginated: async (req, res) => {
		try {
			let {
				sort = "all",
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			sort = sort.toLowerCase(); // Convert sort to lowercase for uniformity
			page = Number(page); // Convert to number
			limit = Number(limit);

			// ------------------------ Input Validations ----------------------- //

			if (!sort || !isNaN(sort)) {
				commonHelper.response(
					res,
					null,
					400,
					"Sort parameter is invalid and must contain letters ! The default query sort are 'all', while specific sort options are 'user', 'admin'.",
				);
			}

			// ------------------------ Input Validations ----------------------- //

			let userResults = null;
			let adminResults = null;

			let payload = null;

			if (sort === "all") {
				const { skip, total, totalPages } =
					(await pagination({ page, limit, table: "users" })) +
					(await pagination({ page, limit, table: "admin" }));

				userResults = await prisma.users.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				adminResults = await prisma.admin.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				const combinedList = [
					...userResults.map((u) => ({ ...u, role: "User" })),
					...adminResults.map((a) => ({ ...a, role: "Admin" })),
				];

				payload = {
					role: "all",
					page,
					limit,
					total,
					totalPages,
					combinedList,
				};
			} else if (sort === "user") {
				const { skip, total, totalPages } = await pagination({
					page,
					limit,
					table: "users",
				});
				userResults = await prisma.users.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				payload = {
					role: "user",
					page,
					limit,
					total,
					totalPages,
					userResults,
				};
			} else if (sort === "admin") {
				const { skip, total, totalPages } = await pagination({
					page,
					limit,
					table: "admin",
				});
				adminResults = await prisma.admin.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				payload = {
					role: "admin",
					page,
					limit,
					total,
					totalPages,
					adminResults,
				};
			} else {
				return commonHelper.response(
					res,
					null,
					400,
					"Invalid sort option ! Available sort options: 'all', 'user' or 'admin'.",
				);
			}

			return commonHelper.response(
				res,
				payload,
				200,
				"List of users fetched !",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	GetTop3ProductsAndCategory: async (req, res) => {
		try {
			const getTop3ProductsAndCategoryTransaction = await prisma.$transaction(
				async (tx) => {
					const top3Products = await tx.$queryRaw`
						SELECT 
							p.name, 
							SUM(oi.quantity)::INT as total_sold -- ::INT prevents the BigInt error
						FROM "ordered_item" oi
						JOIN "products" p ON oi."product_id" = p.id
						GROUP BY p.name
						ORDER BY total_sold DESC
						LIMIT 3;
						`;
					const top3Categories = await tx.$queryRaw`
						SELECT 
							p.category, 
							SUM(oi.quantity) as total_sold
						FROM "ordered_item" oi
						JOIN "products" p ON oi.product_id = p.id
						GROUP BY p.category
						ORDER BY total_sold DESC
						LIMIT 3;
					`;

					const productsPayload = {
						top3Products,
					};

					const categoriesPayload = {
						top3Categories,
					};

					const payload = {
						productsPayload,
						categoriesPayload,
					};

					return payload;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					setTimeout: 10000,
				},
			);

			return commonHelper.response(
				res,
				getTop3ProductsAndCategoryTransaction,
				200,
				"Top 3 products and categories fetched successfully !",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	GetPaginatedUserOrders: async (req, res) => {
		try {
			let {
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			page = Number(page);
			limit = Number(limit);

			// ------------------------ Pagination Logic ----------------------- //

			const { skip, total, totalPages } = await pagination({
				page,
				limit,
				table: "orders",
			});

			// ------------------------ Pagination Logic ----------------------- //

			const getPaginatedUserOrders = await prisma.orders.findMany({
				select: {
					id: true,
					order_status: true,
					total_price: true,
					order_date: true,
					users: {
						select: { avatar_url: true, email: true },
					},
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
				getPaginatedUserOrders,
			};

			return commonHelper.response(
				res,
				payload,
				200,
				"List of paginated user orders fetched !",
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	GetUserOrderDetail: async (req, res) => {
		try {
			let { id } = req.params;

			// ------------------------ Input Validations ----------------------- //
			id = Number(id);
			const idCheck = serialIdCheck(id);

			if (!idCheck) {
				return commonHelper.response(res, null, 400, "Order ID is invalid !");
			}

			// ------------------------ Input Validations ----------------------- //

			const getUserOrdersDetail = await prisma.orders.findUnique({
				where: { id: id },
				select: {
					id: true,
					order_status: true,
					ordered_item: {
						select: {
							quantity: true,
							price_at_order: true,
							products: {
								select: { name: true, photo_url: true },
							},
						},
					},
					users: {
						select: { full_name: true, phone_number: true },
					},
					user_address: {
						select: {
							street: true,
							kecamatan: true,
							city: true,
							province: true,
							postal_code: true,
							detail: true,
						},
					},
					payments: {
						select: {
							amount_to_pay: true,
						},
					},
				},
				relationLoadStrategy: "join",
			});

			return commonHelper.response(
				res,
				getUserOrdersDetail,
				200,
				"Detail of user orders fetched !",
			);
		} catch (error) {
			if (error.code === "P2025") {
				return commonHelper.response(res, null, 404, "Order ID not found !");
			}
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	ChangeMultipleUserOrdersStatus: async (req, res) => {
		try {
			let { updates } = req.body;

			// Initial Validation
			if (!Array.isArray(updates) || updates.length === 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"Updates array is required!",
				);
			}

			// Pre-process and Bulk Validate Data (Synchronous)
			const updateMap = new Map();
			const orderIds = updates.map(([idStr, status]) => {
				const id = Number(idStr);

				// Basic validation
				if (
					serialIdCheck(id) !== true ||
					!ORDER_CONSTRAINT.STATUS_ENUM.includes(status)
				) {
					throw new Error(`Invalid data: ID ${idStr} or Status ${status}`);
				}
				updateMap.set(id, status);
				return id;
			});

			// Bulk Fetch existing statuses
			const existingOrders = await prisma.orders.findMany({
				where: { id: { in: orderIds } },
				select: { id: true, order_status: true },
			});

			// Check if all IDs exist
			if (existingOrders.length !== orderIds.length) {
				throw new Error("NOT_ALL_FOUND");
			}
			// Check for any already completed orders
			existingOrders.forEach((order) => {
				if (order.order_status === "Selesai") {
					throw new Error("ALREADY_COMPLETED");
				}
			});

			// Execute Batch Transaction

			const arrayTransactionTime = 7000 + 3000 * updates.length; // Estimate 7 + 3 seconds per update item

			const results = await prisma.$transaction(
				async (tx) => {
					const promises = [];

					for (const [orderId, status] of updateMap) {
						// Handle Payment logic if status is "Selesai"
						if (status === "Selesai") {
							promises.push(
								tx.$executeRaw`
									UPDATE "payments"
									SET "amount_paid" = "amount_to_pay",
										"payment_status" = 'Sukses'
									WHERE "order_id" = ${orderId}
								`,
							);
						}

						// Add the Order Update to the promise array
						promises.push(
							tx.orders.update({
								where: { id: orderId },
								data: { order_status: status },
							}),
						);
					}

					// Run all updates in parallel within the transaction
					return await Promise.all(promises);
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					timeout: arrayTransactionTime,
				},
			);

			return commonHelper.response(
				res,
				results,
				200,
				"All order statuses updated successfully!",
			);
		} catch (error) {
			if (error.message === "NOT_ALL_FOUND") {
				return commonHelper.response(
					res,
					null,
					404,
					"One or more order IDs were not found!",
				);
			}
			if (error.message === "ALREADY_COMPLETED") {
				return commonHelper.response(
					res,
					null,
					403,
					"One of the id have been completed, cannot update completed order status !",
				);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	DeleteMultipleOrders: async (req, res) => {
		try {
			const { deletes } = req.body;

			// 1. Initial Validation
			if (!Array.isArray(deletes) || deletes.length === 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"Deletes array is required!",
				);
			}

			const arrayTransactionTime = 7000 + 5000 * deletes.length; // Estimate 7 + 5 seconds per delete item

			const orderIds = deletes.map((id) => Number(id));

			const results = await prisma.$transaction(
				async (tx) => {
					// 1. Fetch Orders and Their Items
					const ordersWithItems = await tx.orders.findMany({
						where: { id: { in: orderIds } },
						select: {
							id: true,
							user_id: true,
							order_date: true,
							total_price: true,
							order_status: true,
							destination: true,
							ordered_item: {
								select: { product_id: true, quantity: true },
							},
						},
					});
					// Cant delete if one of the orders is already completed
					if (ordersWithItems.length !== orderIds.length) {
						throw new Error("NOT_ALL_FOUND");
					}

					// Cant delete if one of the orders is already completed
					const completedOrder = ordersWithItems.find(
						(o) => o.order_status === "Selesai",
					);

					if (completedOrder) {
						throw new Error("ALREADY_COMPLETED");
					}

					// 2. Prepare Stock Return Promises
					const stockPromises = [];
					ordersWithItems.forEach((order) => {
						order.ordered_item.forEach((item) => {
							stockPromises.push(
								tx.products.update({
									where: { id: item.product_id },
									data: {
										stock: { increment: item.quantity },
										sold: { decrement: item.quantity },
									},
								}),
							);
						});
					});

					// 3. Perform Bulk Deletions
					// Delete selected payments
					await tx.payments.deleteMany({
						where: { order_id: { in: orderIds } },
					});

					// Delete selected orders
					await tx.orders.deleteMany({
						where: { id: { in: orderIds } },
					});

					// Execute selected stock updates in parallel
					await Promise.all(stockPromises);

					return ordersWithItems; // Return the data so the frontend knows what was deleted
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					timeout: arrayTransactionTime,
				},
			);

			// Invalidate product pagination cache (stock and sold properties) in Redis
			await invalidateProductPaginationCache();

			return commonHelper.response(
				res,
				results,
				200,
				"All selected orders deleted successfully!",
			);
		} catch (error) {
			if (error.message === "NOT_ALL_FOUND") {
				return commonHelper.response(
					res,
					null,
					404,
					"One or more order IDs were not found!",
				);
			}
			if (error.message === "ALREADY_COMPLETED") {
				return commonHelper.response(
					res,
					null,
					403,
					"One of the id have been completed, cannot delete completed order status !",
				);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = adminController;
