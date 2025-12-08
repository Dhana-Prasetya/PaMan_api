const { Prisma, PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common");
const productQuantityCheck = require("../helper/productQuantityCheck");
const serialIdCheck = require("../helper/serial-id-check");
const {
	PAGINATION_CONSTRAINT,
	ORDER_CONSTRAINT,
} = require("../config/inputConstraint");
const paginationCheck = require("../helper/paginationCheck");
const capitalizeFirstLetter = require("../helper/capitalizeFirstLetter");

const prisma = new PrismaClient();

const userOrderControllers = {
	OrderProductDirectly: async (req, res) => {
		try {
			if (!req.body) {
				return commonHelper.response(
					res,
					null,
					400,
					"Request body is missing !"
				);
			}

			let { product_id, quantity, address_id, payment_method } = req.body;

			if (!product_id || !quantity || !address_id || !payment_method) {
				return commonHelper.response(
					res,
					null,
					400,
					"Product id, quantity, address id, and payment method ('COD') fields are required !"
				);
			}

			if (payment_method !== "COD") {
				return commonHelper.response(
					res,
					null,
					400,
					"Only COD payment method is supported at the moment !"
				);
			}

			product_id = Number(product_id);
			address_id = Number(address_id);
			const isInteger = Number.isInteger(address_id);
			quantity = Number(quantity);

			// ------------------------ Input Validations ----------------------- //

			const idCheck = serialIdCheck(product_id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, idCheck);
			}

			if (!address_id || address_id < 0 || !isInteger) {
				return commonHelper.response(
					res,
					null,
					400,
					"Address ID is required and must be a valid integer !"
				);
			}

			const validProductQuantity = productQuantityCheck(quantity);

			if (validProductQuantity !== true) {
				return commonHelper.response(res, null, 400, validProductQuantity);
			}

			const getUserAddress = await prisma.user_address.findFirst({
				where: {
					user_id: req.user.id,
					id: address_id,
				},
				select: { id: true },
				relationLoadStrategy: "join",
			});

			if (!getUserAddress) {
				return commonHelper.response(
					res,
					null,
					404,
					"User address not found !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const orderProductDirectlyTransaction = await prisma.$transaction(
				async (tx) => {
					if (!getUserAddress) {
						throw new Error("ADDRESS_NOT_FOUND");
					}

					const isProductAvaiable = await tx.products.findUnique({
						where: {
							id: product_id,
						},
						select: { stock: true, price: true, discounted_price: true },
						relationLoadStrategy: "join",
					});

					if (!isProductAvaiable) {
						throw new Error("PRODUCT_NOT_FOUND");
					}

					if (isProductAvaiable.stock < quantity) {
						throw new Error("INSUFFICIENT_STOCK");
					}

					let amountToPay;
					let priceAtOrder;

					if (isProductAvaiable.discounted_price) {
						amountToPay = isProductAvaiable.discounted_price * quantity; // Use discounted price if available
						priceAtOrder = isProductAvaiable.discounted_price;
					} else {
						amountToPay = isProductAvaiable.price * quantity; // Use regular price if no discount
						priceAtOrder = isProductAvaiable.price;
					}

					const makeOrder = await tx.orders.create({
						data: {
							user_id: req.user.id,
							total_price: amountToPay,
							order_status: "Dikemas",
							destination: getUserAddress.id,
						},
					});

					const makeOrderDetails = await tx.ordered_item.create({
						data: {
							order_id: makeOrder.id, // Get the order ID from the created order
							product_id: product_id,
							quantity: quantity,
							price_at_order: priceAtOrder,
						},
					});

					const makePaymentRecord = await tx.payments.create({
						// Create payment record FOR COD ONLY
						data: {
							order_id: makeOrder.id,
							payment_method: payment_method,
							amount_paid: 0, // Since COD, amount paid is zero at order time
							amount_to_pay: amountToPay,
							payment_status: "Proses",
						},
					}); // Create payment record

					const updateProductStock = await tx.products.update({
						where: { id: product_id },
						data: { stock: { decrement: quantity } },
					});

					return makePaymentRecord;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					setTimeout: 15000,
				}
			);

			return commonHelper.response(
				res,
				orderProductDirectlyTransaction,
				201,
				"Order placed successfully !"
			);
		} catch (error) {
			if (error.message === "PRODUCT_NOT_FOUND") {
				return commonHelper.response(res, null, 404, "Product not found !");
			}

			if (error.message === "INSUFFICIENT_STOCK") {
				return commonHelper.response(res, null, 400, "Insufficient stock !");
			}

			if (error.message === "ADDRESS_NOT_FOUND") {
				return commonHelper.response(
					res,
					null,
					404,
					"User address not found !"
				);
			}

			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	GetPaginatedMyOrders: async (req, res) => {
		try {
			let {
				sort = "all",
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			// ------------------------ Input Validations ----------------------- //

			page = Number(page);
			limit = Number(limit);

			let paginationErrors = {};
			paginationErrors = paginationCheck(page, limit);

			if (Object.keys(paginationErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ paginationErrors });
			}

			sort = sort.toLowerCase();
			sort = capitalizeFirstLetter(sort);

			if (sort !== "All") {
				if (!ORDER_CONSTRAINT.USER_STATUS_ENUM.includes(sort)) {
					return commonHelper.response(
						res,
						null,
						400,
						`Sort must be one of the following: 'dikemas', 'dikirim', 'selesai', or 'all' !`
					);
				}
			}

			// ------------------------ Input Validations ----------------------- //

			// ------------------------ Pagination Logic ----------------------- //
			const skip = (page - 1) * limit;
			let total = await prisma.orders.count();
			const totalPages = Math.ceil(total / limit);
			// ------------------------ Pagination Logic ----------------------- //

			let getPaginatedMyOrdersSorted = null;

			if (sort === "All") {
				// No sorting, get all orders
				getPaginatedMyOrdersSorted = await prisma.orders.findMany({
					where: { user_id: req.user.id },
					select: {
						order_date: true,
						ordered_item: {
							select: { products: { select: { name: true, photo_url: true } } },
						},
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});
			} else {
				// Filter by specific order status
				getPaginatedMyOrdersSorted = await prisma.orders.findMany({
					where: { user_id: req.user.id },
					select: {
						order_date: true,
						ordered_item: {
							select: { products: { select: { name: true, photo_url: true } } },
						},
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});
			}

			const payload = {
				sort,
				page,
				limit,
				total,
				totalPages,
				getPaginatedMyOrdersSorted,
			};

			return commonHelper.response(
				res,
				payload,
				200,
				"List of sorted orders fetched ! If the list is empty, the user has no orders for corresponding sort yet."
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	GetMyDetailOrder: async (req, res) => {
		try {
			let { id } = req.params;

			// ------------------------ Input Validations ----------------------- //
			id = Number(id);
			const idCheck = serialIdCheck(id);

			if (!idCheck) {
				return commonHelper.response(res, null, 400, "Order ID is invalid !");
			}

			// ------------------------ Input Validations ----------------------- //

			const getMyOrderDetail = await prisma.orders.findUnique({
				where: { id: id, user_id: req.user.id },
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
						select: { fullname: true, phone_number: true },
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
				getMyOrderDetail,
				200,
				"Detail of user orders fetched !"
			);
		} catch (error) {
			if (error.code === "P2025") {
				return commonHelper.response(res, null, 404, "Order ID not found !");
			}
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = userOrderControllers;
