const { Prisma, PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common");
const serialIdCheck = require("../helper/serial-id-check");
const {
	PRODUCT_CONSTRAINT,
	PAYMENT_CONSTRAINT,
} = require("../config/inputConstraint");
const prisma = new PrismaClient();

const userCartControllers = {
	GetUserCart: async (req, res) => {
		try {
			const getUserCart = await prisma.carts.findUnique({
				where: {
					user_id: req.user.id,
				},
				include: {
					// Prisma sql join to include related cart items and product details
					carts_items: {
						include: {
							products: {
								select: {
									name: true,
									stock: true,
									price: true,
									photo_url: true,
								},
							},
						},
					},
				}, // Include 'carts_items' table in the response
				relationLoadStrategy: "join",
			});

			if (!getUserCart) {
				return commonHelper.response(res, null, 404, "Cart not found");
			}

			commonHelper.response(
				res,
				getUserCart,
				200,
				`User cart retrieved successfully. If the result is empty, the cart for the corresponding user has no items.`
			);
		} catch (error) {
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

			if (
				!quantity ||
				quantity < 1 ||
				quantity > PRODUCT_CONSTRAINT.MAX_STOCK
			) {
				// Quantity must be greater than zero
				return commonHelper.response(
					res,
					null,
					400,
					"Quantity field required and must be integer greater than zero"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const isProductExist = await prisma.products.findUnique({
				// Check if product exists
				where: {
					id: id,
				},
				select: { id: true, stock: true },
			});

			if (!isProductExist) {
				return commonHelper.response(res, null, 404, "Product not found");
			}

			if (isProductExist.stock < quantity) {
				return commonHelper.response(
					res,
					null,
					400,
					"Insufficient product stock"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const addProductToCartTransaction = await prisma.$transaction(
				async (tx) => {
					let cart = await tx.carts.findUnique({
						// Get cart ID for the user
						where: {
							user_id: req.user.id,
						},
						select: { id: true, carts_items: true }, // Also select cart items
					});

					if (!cart) {
						// If cart does not exist, create a new cart with the same variable name
						cart = await tx.carts.create({
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
							include: {
								products: { select: { name: true, photo_url: true } },
							},
						});

						return updateItemQuantity; // Return the updated item
					} else {
						// If product does not exist in cart, create a new cart item
						const newItemQuantity = await tx.carts_items.create({
							data: {
								cart_id: cart.id,
								product_id: id,
								quantity: quantity,
							},
							include: {
								products: { select: { name: true, photo_url: true } },
							},
						});

						return newItemQuantity; // Return the new item
					}
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
					setTimeout: 15000,
				}
			);

			return commonHelper.response(
				res,
				addProductToCartTransaction,
				201,
				"Product added to cart successfully !"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	DecreaseProductQuantityFromCart: async (req, res) => {
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

			if (!quantity) {
				return commonHelper.response(
					res,
					null,
					400,
					"Quantity field to decrease is required !"
				);
			}

			const isInt = Number.isInteger(quantity);

			if (quantity > PRODUCT_CONSTRAINT.MAX_STOCK || quantity < 1 || !isInt) {
				// Quantity must be greater than zero
				return commonHelper.response(
					res,
					null,
					400,
					"Quantity field need to be an positive integer !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const decreaseProductQuantityFromCartTransaction =
				await prisma.$transaction(
					async (tx) => {
						const getUserCart = await tx.carts.findUnique({
							where: {
								user_id: req.user.id,
							},
							select: {
								id: true,
								carts_items: {
									where: { product_id: id },
									select: {
										id: true,
										quantity: true,
									},
								},
							},
						});

						if (!getUserCart) {
							throw new Error("CART_NOT_FOUND");
						}

						const cartItem = getUserCart.carts_items[0]; // Get the specific cart item
						if (!cartItem) throw new Error("PRODUCT_NOT_IN_CART");

						const decreasedItem = cartItem.quantity - quantity; // Calculate new quantity
						let updateCartItem = null;

						if (decreasedItem < 1) {
							// If quantity drops below 1, remove the item from cart
							updateCartItem = await tx.carts_items.delete({
								where: {
									id: cartItem.id,
								},
							});

							return updateCartItem;
						} else {
							updateCartItem = await tx.carts_items.update({
								where: {
									id: cartItem.id,
								},
								data: {
									quantity: decreasedItem,
								},
							});

							return updateCartItem;
						}
					},
					{
						isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
						setTimeout: 15000,
					}
				);

			return commonHelper.response(
				res,
				decreaseProductQuantityFromCartTransaction,
				200,
				"Product quantity decreased successfully !"
			);
		} catch (error) {
			if (error.message === "CART_NOT_FOUND") {
				return commonHelper.response(res, null, 404, "User cart not found !");
			}
			if (error.message === "PRODUCT_NOT_IN_CART") {
				return commonHelper.response(
					res,
					null,
					404,
					"Product not found in cart !"
				);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	RemoveMultipleProductFromCart: async (req, res) => {
		const { product_id } = req.body;
		try {
			// Validate that input exists and is an array
			if (!Array.isArray(product_id) || product_id.length === 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"product_id must be a non-empty array"
				);
			}

			// Perform the Batch Deletion

			const deleteResult = await prisma.carts_items.deleteMany({
				where: {
					product_id: {
						in: product_id.map((id) => Number(id)), // Batch delete operations using IN clause and JS map
					},
					carts: {
						user_id: req.user.id,
					},
				},
			});

			// 3. Check result
			if (deleteResult.count === 0) {
				return commonHelper.response(
					res,
					null,
					404,
					"No matching products found in cart to delete"
				);
			}

			return commonHelper.response(
				res,
				deleteResult,
				200,
				"Product removed from cart successfully !"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	CheckoutProductFromCart: async (req, res) => {
		try {
			if (!req.body) {
				return commonHelper.response(
					res,
					null,
					400,
					"Request body is missing !"
				);
			}
			let { address_id, payment_method, product_id } = req.body;
			const userId = req.user.id;

			const productIds = product_id.map((id) => Number(id));
			address_id = Number(address_id);

			// ------------------------ Input Validations ----------------------- //
			if (!address_id || !payment_method || !productIds.length) {
				return commonHelper.response(
					res,
					null,
					400,
					"Address ID, payment method, and selected items are required!"
				);
			}

			const addressCheck = serialIdCheck(address_id);

			if (addressCheck !== true) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, addressCheck);
			}

			const checkAddress = await prisma.user_address.findFirst({
				where: {
					id: address_id,
					user_id: req.user.id,
				},
			});

			if (!checkAddress) {
				return commonHelper.response(
					res,
					null,
					404,
					"Address not found for the user."
				);
			}

			// Fetch selected cart items to get current quantities
			const cartItems = await prisma.carts_items.findMany({
				where: {
					product_id: { in: productIds }, // Filter by selected IDs
					carts: { user_id: userId }, // Scope to the current user's cart
				},
				select: { product_id: true, quantity: true },
			});

			if (cartItems.length !== productIds.length) {
				throw new Error("SELECTED_ITEMS_NOT_FOUND_IN_CART");
			}

			// Fetch product details (stock and price) for all selected items
			const products = await prisma.products.findMany({
				where: { id: { in: productIds } },
				select: {
					id: true,
					stock: true,
					discounted_price: true,
					price: true,
					name: true,
				},
			});

			// Map product details for quick lookup
			const productMap = new Map(products.map((p) => [p.id, p]));

			// --- Final Pre-Transaction Stock Validation (using fetched quantities) ---
			for (const item of cartItems) {
				const product = productMap.get(item.product_id);

				// Check if product exists in the DB or if stock is insufficient
				if (!product || product.stock < item.quantity) {
					throw new Error(
						`INSUFFICIENT_STOCK_${product?.name || item.product_id}`
					);
				}
			}

			const transactionTime = 15000 + productIds.length * 5000;

			const checkoutTransaction = await prisma.$transaction(
				async (tx) => {
					// Get the user's cart ID
					const userCart = await tx.carts.findUnique({
						where: { user_id: userId },
						select: { id: true },
					});

					let totalAmount = 0;
					const orderItemsData = [];

					for (const item of cartItems) {
						const product = productMap.get(item.product_id);
						const orderQuantity = item.quantity;
						const price = product.discounted_price || product.price;

						totalAmount += price * orderQuantity;

						orderItemsData.push({
							product_id: product.id,
							quantity: orderQuantity,
							price_at_order: price,
						});

						// Deduct Stock (Critical operation inside the transaction)
						await tx.products.update({
							where: { id: product.id },
							data: {
								stock: { decrement: orderQuantity },
								sold: { increment: orderQuantity },
							},
						});
					}

					// Create Order Header
					const newOrder = await tx.orders.create({
						data: {
							user_id: userId,
							total_price: totalAmount,
							order_status: "Dikemas",
							destination: address_id,
						},
					});

					// Create All Ordered Items (Batch Insert)
					await tx.ordered_item.createMany({
						data: orderItemsData.map((item) => ({
							...item,
							order_id: newOrder.id,
						})),
					});

					// Create Payment Record (COD example)
					const finalPaymentAmount =
						totalAmount +
						(PAYMENT_CONSTRAINT.PACKAGING_FEE +
							PAYMENT_CONSTRAINT.SHIPPING_FEE);

					await tx.payments.create({
						data: {
							order_id: newOrder.id,
							payment_method,
							amount_to_pay: finalPaymentAmount,
							payment_status: "Proses",
							amount_paid: 0,
						},
					});

					// Remove Ordered Items from Cart
					await tx.carts_items.deleteMany({
						where: {
							cart_id: userCart.id,
							product_id: { in: productIds },
						},
					});

					return newOrder;
				},
				{
					isolationLevel: "Serializable",
					timeout: transactionTime,
				}
			);

			return commonHelper.response(
				res,
				checkoutTransaction,
				201,
				"Checkout successful!"
			);
		} catch (error) {
			if (error.message === "SELECTED_ITEMS_NOT_FOUND_IN_CART") {
				return commonHelper.response(
					res,
					null,
					404,
					"Selected items not found in cart."
				);
			}
			if (error.message.startsWith("INSUFFICIENT_STOCK_")) {
				const productName = error.message.replace("INSUFFICIENT_STOCK_", "");
				return commonHelper.response(
					res,
					null,
					400,
					`Insufficient stock for product: ${productName}`
				);
			}
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},
};

module.exports = userCartControllers;
