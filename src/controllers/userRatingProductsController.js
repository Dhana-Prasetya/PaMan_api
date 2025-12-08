const { Prisma } = require("@prisma/client");
const commonHelper = require("../helper/common");
const serialIdCheck = require("../helper/serial-id-check");

const prisma = new Prisma.PrismaClient();

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

			let { product_id } = req.params;

			let { review, rating } = req.body;

			product_id = Number(product_id);

			// ----------------------- Input Validations -----------------------

			const idCheck = serialIdCheck(product_id);

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
				where: { id: product_id },
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
							product_id: product_id,
						},
					},
				},
				select: {
					id: true, // We only need to know if it exists
				},
				// Use join for accurate snapshot check
				relationLoadStrategy: "join",
			});

			if (!isEligibleToRate) {
				throw new Error(
					"You must purchase and receive this product before rating."
				);
			}

			const addReviewAndRating = await prisma.product_reviews.create({
				data: {
					user_id: req.user.id,
					product_id: product_id,
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
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error !");
		}
	},
};

module.exports = userRatingProductsController;
