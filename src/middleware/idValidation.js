const { ID_CONSTRAINT } = require("../config/inputConstraint");
const commonHelper = require("../helper/common.js");

const serialIdCheck = (req, res, next) => {
	try {
		let id = req.params.id;
		id = Number(id);

		const intIdCheck = Number.isInteger(id);

		if (!id) {
			return commonHelper.response(res, null, 400, "Product ID is required !");
		}

		if (
			!intIdCheck ||
			id < ID_CONSTRAINT.MIN_INT ||
			id > ID_CONSTRAINT.MAX_INT ||
			isNaN(id)
		) {
			return `ID must be a integer between ${ID_CONSTRAINT.MIN_INT} and ${ID_CONSTRAINT.MAX_INT} !`;
		} else {
			next();
		}
	} catch (error) {
		console.log(error);
		return commonHelper.response(res, null, 500, "Internal Server Error");
	}
};

module.exports = serialIdCheck;
