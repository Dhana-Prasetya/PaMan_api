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
const paginationCheck = require("../helper/paginationCheck.js");
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
			const { updates } = req.body;

			// 1. Initial Validation
			if (!Array.isArray(updates) || updates.length === 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"Updates array is required!",
				);
			}

			const arrayTransactionTime = 10000 + 4000 * updates.length; // Estimate 10 + 4 seconds per update item

			// 2. Execution via Transaction for Atomicity
			const results = await prisma.$transaction(
				async (tx) => {
					const updatedRecords = [];

					for (const update of updates) {
						const [orderIdStr, status] = update;
						let orderId = Number(orderIdStr);

						// Per-item Validation
						const validId = serialIdCheck(orderId);

						if (
							validId !== true ||
							!ORDER_CONSTRAINT.STATUS_ENUM.includes(status)
						) {
							throw new Error(
								`Invalid data: ID ${orderIdStr} or Status ${status}. Avaiable statuses are: 'Dikemas', 'Dikirim', 'Diterima','Selesai'`,
							);
						}

						const ifAlreadyCompleted = await tx.orders.findUnique({
							where: { id: orderId },
							select: { order_status: true },
							relationLoadStrategy: "join",
						});

						if (ifAlreadyCompleted.order_status === "Selesai") {
							throw new Error("ALREADY_COMPLETED");
						}

						if (status === "Selesai") {
							const completePayment =
								await tx.$executeRaw` -- Raw query to update payment status and amount_paid
								UPDATE "payments" 
								SET "amount_paid" = "amount_to_pay", 
									"payment_status" = 'Sukses' 
								WHERE "order_id" = ${orderId};
							`;
						}

						const updated = await tx.orders.update({
							where: { id: orderId },
							data: { order_status: status },
						});

						updatedRecords.push(updated);
					}
					return updatedRecords;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					setTimeout: arrayTransactionTime,
				},
			);

			return commonHelper.response(
				res,
				results,
				200,
				"All order statuses updated successfully!",
			);
		} catch (error) {
			if (error.code === "P2025") {
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
					"Updates array is required!",
				);
			}

			const arrayTransactionTime = 10000 + 5000 * deletes.length; // Estimate 10 + 4 seconds per update item

			// 2. Execution via Transaction for Atomicity
			const results = await prisma.$transaction(
				async (tx) => {
					const updatedRecords = [];

					for (const del of deletes) {
						const [orderIdStr] = del;
						const orderId = Number(orderIdStr);

						// Deleting payments first due to foreign key restrict delete constraint
						const deletingPayments = await tx.payments.deleteMany({
							where: { order_id: orderId },
						});

						// Delete the Order and retrieve the items
						const deletingOrder = await tx.orders.delete({
							where: { id: orderId },
							select: {
								ordered_item: {
									select: {
										product_id: true,
										quantity: true,
									},
								},
							},
						});

						// Iterate and return stock for each item
						const returnStock = deletingOrder.ordered_item.map(async (item) => {
							return tx.products.update({
								where: { id: item.product_id },
								data: {
									stock: { increment: item.quantity },
									sold: { decrement: item.quantity },
								},
							});
						});

						// Wait for all stock updates to complete
						await Promise.all(returnStock);

						updatedRecords.push(deletingOrder);
					}
					return updatedRecords;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					setTimeout: arrayTransactionTime,
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
			if (error.code === "P2025") {
				return commonHelper.response(
					res,
					null,
					404,
					"One or more order IDs were not found!",
				);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = adminController;
