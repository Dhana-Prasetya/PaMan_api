const { PRODUCT_CONSTRAINT } = require("../config/inputConstraint");

function productQuantityCheck(quantity) {
	const intQuantityCheck = Number.isInteger(quantity);

	if (
		!intQuantityCheck ||
		quantity < PRODUCT_CONSTRAINT.MIN_INT ||
		quantity > PRODUCT_CONSTRAINT.MAX_INT ||
		isNaN(quantity)
	) {
		return `Product quantity must be a integer between ${PRODUCT_CONSTRAINT.MIN_STOCK} and ${PRODUCT_CONSTRAINT.MAX_STOCK} !`;
	} else {
		return true;
	}
}

module.exports = productQuantityCheck;
