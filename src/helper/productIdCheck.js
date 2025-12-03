const { ID_CONSTRAINT } = require("../config/inputConstraint");

function productIdCheck(id) {
	const intIdCheck = Number.isInteger(id);

	if (
		!intIdCheck ||
		id < ID_CONSTRAINT.MIN_INT ||
		id > ID_CONSTRAINT.MAX_INT ||
		isNaN(id)
	) {
		return `Product ID must be a integer between ${ID_CONSTRAINT.MIN_INT} and ${ID_CONSTRAINT.MAX_INT} !`;
	} else {
		return false;
	}
}

module.exports = productIdCheck;
