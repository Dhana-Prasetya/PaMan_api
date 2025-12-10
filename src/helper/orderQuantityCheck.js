const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint");

function orderQuantityCheck(quantity) {
	const intQuantityCheck = Number.isInteger(quantity);

	const maxQuantity = PRODUCT_CONSTRAINT.MAX_STOCK;
	const minQuantity = 1;

	if (
		!intQuantityCheck ||
		quantity < minQuantity ||
		quantity > maxQuantity ||
		isNaN(quantity)
	) {
		return `Order quantity must be a integer between ${minQuantity} and ${maxQuantity} !`;
	} else {
		return true;
	}
}

module.exports = orderQuantityCheck;
