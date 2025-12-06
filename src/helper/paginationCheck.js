const { PAGINATION_CONSTRAINT } = require("../config/inputConstraint");

function paginationCheck(page, limit) {
	const pageIntCheck = Number.isInteger(page); // Check if page and limit are integers
	const limitIntCheck = Number.isInteger(limit);

	// ------------------------ Input Validations ----------------------- //

	const maxPagePosition = PAGINATION_CONSTRAINT.MAX_PAGE_POSITION;
	const maxItemsPerPage = PAGINATION_CONSTRAINT.MAX_ITEMS_PER_PAGE;

	const paginationErrors = {};
	if (page < 1 || !pageIntCheck || page > maxPagePosition) {
		paginationErrors.page = `Page must be a positive integer between 1 and ${maxPagePosition} !`;
	}
	if (limit < 1 || limit > maxItemsPerPage || !limitIntCheck) {
		paginationErrors.limit = `Limit must be a positive integer between 1 and ${maxItemsPerPage} !`;
	}

	return paginationErrors;
}

module.exports = paginationCheck;
