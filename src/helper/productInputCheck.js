const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint.js");

function productInputCheck({
	name = null,
	stock = null,
	price = null,
	description = null,
	category = null,
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

	if (name) {
		if (
			!isNaN(name) ||
			name.length > maxProductNameLength ||
			name.length < minProductNameLength ||
			!allowedNameCheck
		) {
			// Input validation (client always send as string)
			productInputErrors.name = `Product name must contain letters and be between ${minProductNameLength} and ${maxProductNameLength}. Other allowed but optional expression are number, space, and these symbol = (- . , _ - : = ' " () # & | / = ~)`;
		}
	}

	if (stock) {
		if (!intStockCheck || stock < minProductStock || stock > maxProductStock) {
			// Input validation for stock
			productInputErrors.stock = `Stock must be a positive integer with range ${minProductStock} to ${maxProductStock} !`;
		}

		if (!intPriceCheck || price < minProductPrice || price > maxProductPrice) {
			// Input validation for price
			productInputErrors.price = `Price must be a positive integer with range ${minProductPrice} to ${maxProductPrice} !`;
		}
	}

	if (description) {
		if (
			!isNaN(description) ||
			description.length > maxProductDescriptionLength ||
			!allowedDescriptionCheck
		) {
			// Input validation (client always send as string)
			productInputErrors.description = `Description must contain letters and be at most ${maxProductDescriptionLength} characters long. Other allowed but optional expression are number, space, and these symbol = (- . , _ - : = ' " () # & | / = ~) are allowed symbols !`;
		}
	}

	if (category) {
		if (!PRODUCT_CONSTRAINT.CATEGORY_ENUM.includes(category)) {
			productInputErrors.category =
				"Product category only support ''Beras'', ''Sayur'', or ''Buah'' !";
		}
	}

	if (typeof discounted_price === "string") {
		// If it's an empty string, reject it
		if (discounted_price.length === 0) {
			productInputErrors.empty_discounted_price = `Discounted price cant be empty if provided!`;
		}
	}

	if (discounted_price) {
		const numberDiscountedPrice = Number(discounted_price);
		const intDiscountedPriceCheck = Number.isInteger(numberDiscountedPrice);

		// Check 2: Must be non-negative (>= 0)
		// If it's NOT an integer OR it's negative, then it's invalid.
		if (
			!intDiscountedPriceCheck ||
			numberDiscountedPrice < minProductPrice ||
			numberDiscountedPrice > maxProductPrice
		) {
			productInputErrors.discounted_price = `Discounted price must be a non-negative integer with range ${minProductPrice} to ${maxProductPrice}!`;
		}
	}

	return productInputErrors;
}

module.exports = productInputCheck;
