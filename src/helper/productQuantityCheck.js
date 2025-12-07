const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint");

function productQuantityCheck(quantity) {
	const intQuantityCheck = Number.isInteger(quantity);

	const maxQuantity = PRODUCT_CONSTRAINT.MAX_STOCK;
	const minQuantity = PRODUCT_CONSTRAINT.MIN_STOCK;

	if (
		!intQuantityCheck ||
		quantity < minQuantity ||
		quantity > maxQuantity ||
		isNaN(quantity)
	) {
		return `Product quantity must be a integer between ${minQuantity} and ${maxQuantity} !`;
	} else {
		return true;
	}
}

module.exports = productQuantityCheck;
