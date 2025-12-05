const { ID_CONSTRAINT } = require("../config/inputConstraint");

function productIdCheck(id) {
	const productIdErrors = {};

	const intIdCheck = Number.isInteger(id);

	if (
		!intIdCheck ||
		id < ID_CONSTRAINT.MIN_INT ||
		id > ID_CONSTRAINT.MAX_INT ||
		isNaN(id)
	) {
		return (productIdErrors.id = `Product ID must be a integer between ${ID_CONSTRAINT.MIN_INT} and ${ID_CONSTRAINT.MAX_INT} !`);
	}
	return productIdErrors;
}

module.exports = productIdCheck;
