const { Prisma, PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common");
const serialIdCheck = require("../helper/serial-id-check");
const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint");
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
								id: true, // Need to specify this if you use select
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
						setTimeout: 10000,
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
			// 1. Validate that input exists and is an array
			if (!Array.isArray(product_id) || product_id.length === 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"product_id must be a non-empty array"
				);
			}

			// 2. Perform the Batch Deletion

			const deleteResult = await prisma.carts_items.deleteMany({
				where: {
					product_id: {
						in: product_id.map((id) => Number(id)), // Ensure IDs are numbers
					},
					carts: {
						user_id: req.user.id,
					},
				},
			});

			// 3. Check result
			if (deleteResult.count === 0) {
				return res.status(404).json({
					message: "No matching items found to delete.",
				});
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
			let { address_id, payment_method, selected_items } = req.body;
			// selected_items format: [{ product_id: 1, quantity: 2 }, { product_id: 5, quantity: 1 }]

			// ------------------------ Input Validations ----------------------- //
			if (!address_id || !payment_method || !selected_items) {
				return commonHelper.response(
					res,
					null,
					400,
					"Address ID, payment method, and selected items are required !"
				);
			}

			address_id = Number(address_id);

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

			const userId = req.user.id;

			// 1. Validation for the array
			if (!Array.isArray(selected_items) || selected_items.length === 0) {
				return commonHelper.response(
					res,
					null,
					400,
					"Please select at least one item to checkout."
				);
			}

			// ------------------------ Input Validations ----------------------- //

			const productIds = selected_items.map((item) => item.product_id);

			const checkoutTransaction = await prisma.$transaction(
				async (tx) => {
					// 2. Fetch specific items from the cart matching the user's selection
					const userCart = await tx.carts.findUnique({
						where: { user_id: userId },
						include: {
							carts_items: {
								where: { product_id: { in: productIds } }, // Filter by selected IDs
								include: { products: true },
							},
						},
					});

					if (!userCart || userCart.carts_items.length === 0) {
						throw new Error("SELECTED_ITEMS_NOT_FOUND_IN_CART");
					}

					let totalAmount = 0;
					const orderItemsData = [];

					// 3. Loop through SELECTED items
					for (const item of userCart.carts_items) {
						const product = item.products;

						// IMPORTANT: Use the quantity from the INPUT, not the Cart total
						const inputItem = selected_items.find(
							(si) => si.product_id === product.id
						);
						const orderQuantity = inputItem.quantity;

						if (product.stock < orderQuantity) {
							throw new Error(`INSUFFICIENT_STOCK_${product.name}`);
						}

						const price = product.discounted_price || product.price;
						totalAmount += price * orderQuantity;

						orderItemsData.push({
							product_id: product.id,
							quantity: orderQuantity,
							price_at_order: price,
						});

						// Deduct Stock
						await tx.products.update({
							where: { id: product.id },
							data: { stock: { decrement: orderQuantity } },
						});
					}

					// 4. Create Order and Payment (Standard logic)
					const newOrder = await tx.orders.create({
						data: {
							user_id: userId,
							total_price: totalAmount,
							order_status: "Dikemas",
							destination: address_id,
						},
					});

					await tx.ordered_item.createMany({
						data: orderItemsData.map((item) => ({
							...item,
							order_id: newOrder.id,
						})),
					});

					await tx.payments.create({
						data: {
							order_id: newOrder.id,
							payment_method,
							amount_to_pay: totalAmount,
							payment_status: "Proses",
							amount_paid: 0,
						},
					});

					// 5. SELECTIVE REMOVAL: Only remove the items ordered
					await tx.carts_items.deleteMany({
						where: {
							cart_id: userCart.id,
							product_id: { in: productIds },
						},
					});

					return newOrder;
				},
				{
					isolationLevel: "RepeatableRead",
					timeout: 20000,
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
