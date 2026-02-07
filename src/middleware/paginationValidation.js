const { PAGINATION_CONSTRAINT } = require("../config/inputConstraint.js");

const paginationValidation = (req, res, next) => {
	try {
		let {
			page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
			limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
		} = req.query;

		page = Number(page); // Convert to number
		limit = Number(limit);

		const maxPagePosition = PAGINATION_CONSTRAINT.MAX_PAGE_POSITION;
		const maxItemsPerPage = PAGINATION_CONSTRAINT.MAX_ITEMS_PER_PAGE;

		let paginationErrors = {};

		const pageIntCheck = Number.isInteger(page); // Check if page and limit are integers
		const limitIntCheck = Number.isInteger(limit);

		if (page < 1 || !pageIntCheck || page > maxPagePosition) {
			paginationErrors.page = `Page must be a positive integer between 1 and ${maxPagePosition} !`;
		}
		if (limit < 1 || limit > maxItemsPerPage || !limitIntCheck) {
			paginationErrors.limit = `Limit must be a positive integer between 1 and ${maxItemsPerPage} !`;
		}

		if (Object.keys(paginationErrors).length > 0) {
			// If there is any error, return the errors
			return res.status(400).json({ paginationErrors });
		}

		next();
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error !" });
	}
};

module.exports = paginationValidation;
