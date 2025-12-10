const { PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common");
const serialIdCheck = require("../helper/serial-id-check");

const prisma = new PrismaClient();

const userRatingProductsController = {
	RateProduct: async (req, res) => {
		try {
			if (!req.body || !req.params) {
				return commonHelper.response(
					res,
					null,
					400,
					"Request body or parameters are missing!"
				);
			}

			let { id } = req.params;

			let { review, rating } = req.body;

			id = Number(id);
			rating = Number(rating);

			// ----------------------- Input Validations -----------------------

			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, idCheck);
			}

			if (!rating || rating < 1 || rating > 5) {
				return commonHelper.response(
					res,
					null,
					400,
					"Rating must be between 1 and 5 !"
				);
			}

			const productExists = await prisma.products.findUnique({
				where: { id: id },
				relationLoadStrategy: "join",
			});

			if (!productExists) {
				return commonHelper.response(
					res,
					null,
					404,
					"Product with the given ID does not exist !"
				);
			}

			// ----------------------- Input Validations -----------------------

			const isEligibleToRate = await prisma.orders.findFirst({
				where: {
					user_id: req.user.id,
					order_status: "Selesai",
					ordered_item: {
						some: {
							product_id: id,
						},
					},
				},
				select: {
					id: true,
				},
				relationLoadStrategy: "join",
			});

			if (!isEligibleToRate) {
				return commonHelper.response(
					res,
					null,
					403,
					"You must purchase and receive this product before rating."
				);
			}

			const addReviewAndRating = await prisma.product_review.create({
				data: {
					user_id: req.user.id,
					product_id: id,
					review: review,
					rating: rating,
				},
			});
			return commonHelper.response(
				res,
				addReviewAndRating,
				201,
				"Review and rating added successfully!"
			);
		} catch (error) {
			if (error.code === "P2002") {
				return commonHelper.response(
					res,
					null,
					409,
					"User have already reviewed this product."
				);
			}
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error !");
		}
	},

	MarkHelpfulOrNot: async (req, res) => {
		try {
			if (!req.params) {
				return commonHelper.response(
					res,
					null,
					400,
					"Request parameters are missing!"
				);
			}

			let { id, rate } = req.params;

			id = Number(id);
			// ----------------------- Input Validations -----------------------

			const idCheck = serialIdCheck(id);
			if (idCheck !== true) {
				// If there is any error, return the errors
				return commonHelper.response(res, null, 400, idCheck);
			}

			if (isNaN(rate) || (rate !== "1" && rate !== "-1")) {
				return commonHelper.response(
					res,
					null,
					400,
					"Rate must be either '1' (helpful) or '-1' (not helpful)!"
				);
			}

			rate = Number(rate);

			const reviewExists = await prisma.product_review.findUnique({
				// Check if review exists
				where: {
					id: id,
				},
				relationLoadStrategy: "join",
			});

			if (!reviewExists) {
				return commonHelper.response(
					res,
					null,
					404,
					"Review with the given ID does not exist !"
				);
			}

			const rateOwnReview = await prisma.product_review.findUnique({
				// Check if user is rating their own review
				where: {
					id: id,
					user_id: req.user.id,
				},
				relationLoadStrategy: "join",
			});

			if (rateOwnReview) {
				return commonHelper.response(
					res,
					null,
					403,
					"User can not rate their own review."
				);
			}

			// ----------------------- Input Validations -----------------------

			const voteRecord = await prisma.helpful_review.upsert({
				where: {
					// Composite unique ID defined
					review_id_user_id: {
						review_id: id,
						user_id: req.user.id,
					},
				},
				// If the vote doesn't exist, create it
				create: {
					review_id: id,
					user_id: req.user.id,
					helpful: rate, // Stores the vote (1 or -1)
				},
				// If the vote exists, update it (e.g., user changed from unhelpful to helpful)
				update: {
					helpful: rate,
				},
			});
			return commonHelper.response(
				res,
				voteRecord,
				200,
				"Marked review as helpful OR not helpful successfully!"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error !");
		}
	},
};

module.exports = userRatingProductsController;
