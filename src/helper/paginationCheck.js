const { PAGINATION_CONSTRAINT } = require("../config/inputConstraint");

function paginationCheck(page, limit) {
	const pageIntCheck = Number.isInteger(page); // Check if page and limit are integers
	const limitIntCheck = Number.isInteger(limit);

	// ------------------------ Input Validations ----------------------- //

	const paginationErrors = {};
	if (
		page < 1 ||
		!pageIntCheck ||
		page > PAGINATION_CONSTRAINT.MAX_PAGE_POSITION
	) {
		paginationErrors.page = `Page must be a positive integer between 1 and ${PAGINATION_CONSTRAINT.MAX_PAGE_POSITION} !`;
	}
	if (
		limit < 1 ||
		limit > PAGINATION_CONSTRAINT.MAX_ITEMS_PER_PAGE ||
		!limitIntCheck
	) {
		paginationErrors.limit = `Limit must be a positive integer between 1 and ${PAGINATION_CONSTRAINT.MAX_ITEMS_PER_PAGE} !`;
	}

	return paginationErrors;
}

module.exports = paginationCheck;
