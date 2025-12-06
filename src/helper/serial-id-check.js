const { ID_CONSTRAINT } = require("../config/inputConstraint");

function serialIdCheck(id) {
	const intIdCheck = Number.isInteger(id);

	if (
		!intIdCheck ||
		id < ID_CONSTRAINT.MIN_INT ||
		id > ID_CONSTRAINT.MAX_INT ||
		isNaN(id)
	) {
		return `ID must be a integer between ${ID_CONSTRAINT.MIN_INT} and ${ID_CONSTRAINT.MAX_INT} !`;
	} else {
		return true;
	}
}

module.exports = serialIdCheck;
