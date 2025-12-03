const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint.js");

async function productInputCheck({
	name,
	stock,
	price,
	description,
	category,
	discounted_price = null,
}) {
	const errors = {}; // Object to hold every client errors

	const intStockCheck = Number.isInteger(Number(stock));
	const intPriceCheck = Number.isInteger(Number(price));

	if (!isNaN(name)) {
		// Input validation (client always send as string)
		errors.name = "Name must contain letters !";
	}

	if (
		!intStockCheck ||
		stock < PRODUCT_CONSTRAINT.MIN_STOCK ||
		stock > PRODUCT_CONSTRAINT.MAX_STOCK
	) {
		// Input validation for stock
		errors.stock = `Stock must be a positive integer with range ${PRODUCT_CONSTRAINT.MIN_STOCK} to ${PRODUCT_CONSTRAINT.MAX_STOCK} !`;
	}

	if (
		!intPriceCheck ||
		price < PRODUCT_CONSTRAINT.MIN_PRICE ||
		price > PRODUCT_CONSTRAINT.MAX_PRICE
	) {
		// Input validation for price
		errors.price = `Price must be a positive integer with range ${PRODUCT_CONSTRAINT.MIN_PRICE} to ${PRODUCT_CONSTRAINT.MAX_PRICE} !`;
	}

	if (!isNaN(description)) {
		// Input validation (client always send as string)
		errors.description = "Description must contain letters !";
	}

	if (!PRODUCT_CONSTRAINT.CATEGORY_ENUM.includes(category)) {
		errors.category =
			"Product category only support ''Beras'', ''Sayur'', or ''Buah''";
	}

	if (discounted_price) {
		// Check 1: Must be a number and an integer
		const isInteger = Number.isInteger(discounted_price);

		// Check 2: Must be non-negative (>= 0)
		const isNonNegative = discounted_price >= PRODUCT_CONSTRAINT.MIN_PRICE;

		// If it's NOT an integer OR it's negative, then it's invalid.
		if (!isInteger || !isNonNegative) {
			errors.discounted_price =
				"Discounted price must be a non-negative integer!";
		}
	}

	return errors;
}

module.exports = productInputCheck;
