const { Prisma, PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common");
const productQuantityCheck = require("../helper/productQuantityCheck");
const serialIdCheck = require("../helper/serial-id-check");

const prisma = new PrismaClient();

const userOrderControllers = {
	OrderProductDirectly: async (req, res) => {
		try {
			if (!req.body || !req.params) {
				return res
					.status(400)
					.json({ message: "Either request body or params are missing !" });
			}
			let { id } = req.params;
			let { quantity } = req.body;

			id = Number(id);
			quantity = Number(quantity);

			// ------------------------ Input Validations ----------------------- //

			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return res.status(400).json({ idCheck });
			}

			const validProductQuantity = productQuantityCheck(quantity);

			if (validProductQuantity !== true) {
				return res.status(400).json({ validProductQuantity });
			}

			// ------------------------ Input Validations ----------------------- //

			const prismaTransaction = await prisma.$transaction(
				async (tx) => {
					const isProductAvaiable = await tx.products.findUnique({
						where: {
							id: id,
						},
						select: { stock: true, price: true },
					});

					if (!isProductAvaiable) {
						throw new Error("PRODUCT_NOT_FOUND");
					}

					if (isProductAvaiable.stock < quantity) {
						throw new Error("INSUFFICIENT_STOCK");
					}

					const amountToPay = isProductAvaiable.price * quantity;
					const defaultOrderStatus = "Dikemas";

					const makeOrder = await tx.orders.create({
						data: {
							user_id: req.user.id,
							total_price: amountToPay,
							order_status: defaultOrderStatus,
						},
					});

					const makeOrderDetails = await tx.ordered_item.create({
						data: {
							order_id: makeOrder.id, // Get the order ID from the created order
							product_id: id,
							quantity: quantity,
							price_at_order: isProductAvaiable.price,
						},
					});

					const updateProductStock = await tx.products.update({
						where: { id: id },
						data: { stock: { decrement: quantity } },
					});

					return makeOrderDetails;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
					setTimeout: 10000,
				}
			);

			return commonHelper.response(
				res,
				prismaTransaction,
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

			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},

	OrderProductByCart: async (req, res) => {
		try {
			const prismaTransaction = await prisma.$transaction(async (tx) => {}, {
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
				setTimeout: 10000,
			});
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = userOrderControllers;
