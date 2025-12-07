const { Prisma, PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common");
const serialIdCheck = require("../helper/serial-id-check");
const productQuantityCheck = require("../helper/productQuantityCheck");
const prisma = new PrismaClient();

const userCartControllers = {
	GetUserCart: async (req, res) => {
		try {
			const getUserCart = await prisma.carts.findUnique({
				where: {
					user_id: req.user.id,
				},
				include: { carts_items: true }, // Include 'carts_items' table in the response
			});

			if (!getUserCart) {
				throw new Error("CART_NOT_FOUND");
			}

			commonHelper.response(
				res,
				getUserCart,
				200,
				"User cart retrieved successfully"
			);
		} catch (error) {
			if (error.message === "CART_NOT_FOUND") {
				return commonHelper.response(res, 404, "Cart not found");
			}
			console.error(error);
			return commonHelper.response(res, 500, "Internal server error");
		}
	},
	AddProductToCart: async (req, res) => {
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

			const isProductExist = await prisma.products.findUnique({
				// Check if product exists
				where: {
					id: id,
				},
				select: { id: true, stock: true },
			});

			if (!isProductExist) {
				throw new Error("PRODUCT_NOT_FOUND");
			}

			if (isProductExist.stock < quantity) {
				throw new Error("INSUFFICIENT_STOCK");
			}

			// ------------------------ Input Validations ----------------------- //

			const addProductToCartTransaction = await prisma.$transaction(
				async (tx) => {
					const cart = await tx.carts.findUnique({
						// Get cart ID for the user
						where: {
							user_id: req.user.id,
						},
						select: { id: true, carts_items: true }, // Also select cart items
					});

					if (!cart) {
						// If cart does not exist, create a new cart
						const makeCart = await tx.carts.create({
							data: { user_id: req.user.id },
							select: { id: true, carts_items: [] },
						});
					}

					const existingItem = cart.carts_items.find(
						// Check if product already exists in cart
						(item) => item.product_id === id
					);

					if (existingItem) {
						// If product exists, update the quantity
						const updateItemQuantity = await tx.carts_items.update({
							where: { id: existingItem.id },
							data: { quantity: { increment: quantity } }, // Safer atomic update
						});

						return updateItemQuantity;
					} else {
						// If product does not exist in cart, create a new cart item
						const newItemQuantity = await tx.carts_items.create({
							data: {
								cart_id: cart.id,
								product_id: id,
								quantity: quantity,
							},
						});

						return newItemQuantity;
					}
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					setTimeout: 10000,
				}
			);

			return commonHelper.response(
				res,
				addProductToCartTransaction,
				201,
				"Product added to cart successfully !"
			);
		} catch (error) {
			if (error.message === "PRODUCT_NOT_FOUND") {
				return commonHelper.response(res, 404, "Product not found");
			}
			if (error.message === "INSUFFICIENT_STOCK") {
				return commonHelper.response(res, 400, "Insufficient product stock");
			}
			console.error(error);
			return commonHelper.response(res, 500, "Internal server error");
		}
	},

	RemoveProductFromCart: async (req, res) => {
		try {
			console.log("");
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, 500, "Internal server error");
		}
	},

	CheckoutProductFromCart: async (req, res) => {
		try {
			console.log("");
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, 500, "Internal server error");
		}
	},
};

module.exports = userCartControllers;
