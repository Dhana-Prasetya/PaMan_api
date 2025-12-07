const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint.js");

async function productInputCheck({
	name,
	stock,
	price,
	description,
	category,
	discounted_price = null,
}) {
	const productInputErrors = {}; // Object to hold every client errors

	const intStockCheck = Number.isInteger(Number(stock));
	const intPriceCheck = Number.isInteger(Number(price));

	const maxProductStock = PRODUCT_CONSTRAINT.MAX_STOCK;
	const minProductStock = PRODUCT_CONSTRAINT.MIN_STOCK;

	const maxProductPrice = PRODUCT_CONSTRAINT.MAX_PRICE;
	const minProductPrice = PRODUCT_CONSTRAINT.MIN_PRICE;

	const maxProductNameLength = PRODUCT_CONSTRAINT.MAX_NAME_VARCHAR;
	const minProductNameLength = PRODUCT_CONSTRAINT.MIN_NAME_VARCHAR;

	const allowedNameRegex = PRODUCT_CONSTRAINT.ALLOWED_NAME_REGEX;
	const allowedDescriptionRegex = PRODUCT_CONSTRAINT.ALLOWED_DESCRIPTION_REGEX;

	const allowedNameCheck = allowedNameRegex.test(name); // Validate name against allowed regex
	const allowedDescriptionCheck = allowedDescriptionRegex.test(description);

	const maxProductDescriptionLength = PRODUCT_CONSTRAINT.MAX_TEXT_VARCHAR;

	if (
		!isNaN(name) ||
		name.length > maxProductNameLength ||
		name.length < minProductNameLength ||
		!allowedNameCheck
	) {
		// Input validation (client always send as string)
		productInputErrors.name = `Product name must contain letters and be between ${minProductNameLength} and ${maxProductNameLength}. Other allowed but optional expression are number, space, and these symbol = (- . , _ - : = ' " () # & | / = ~)`;
	}

	if (!intStockCheck || stock < minProductStock || stock > maxProductStock) {
		// Input validation for stock
		productInputErrors.stock = `Stock must be a positive integer with range ${minProductStock} to ${maxProductStock} !`;
	}

	if (!intPriceCheck || price < minProductPrice || price > maxProductPrice) {
		// Input validation for price
		productInputErrors.price = `Price must be a positive integer with range ${minProductPrice} to ${maxProductPrice} !`;
	}

	if (
		!isNaN(description) ||
		description.length > maxProductDescriptionLength ||
		!allowedDescriptionCheck
	) {
		// Input validation (client always send as string)
		productInputErrors.description = `Description must contain letters and be at most ${maxProductDescriptionLength} characters long. Other allowed but optional expression are number, space, and these symbol = (- . , _ - : = ' " () # & | / = ~) are allowed symbols !`;
	}

	if (!PRODUCT_CONSTRAINT.CATEGORY_ENUM.includes(category)) {
		productInputErrors.category =
			"Product category only support ''Beras'', ''Sayur'', or ''Buah'' !";
	}

	if (discounted_price) {
		const intDiscountedPriceCheck = Number.isInteger(Number(discounted_price));

		// Check 2: Must be non-negative (>= 0)
		const isNonNegative = discounted_price >= PRODUCT_CONSTRAINT.MIN_PRICE;

		// If it's NOT an integer OR it's negative, then it's invalid.
		if (!intDiscountedPriceCheck || !isNonNegative) {
			productInputErrors.discounted_price =
				"Discounted price must be a non-negative integer!";
		}
	}

	return productInputErrors;
}

module.exports = productInputCheck;
