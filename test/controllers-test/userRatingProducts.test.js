const userRatingProductsController = require("../../src/controllers/userRatingProductsController");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		product_review: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		products: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		helpful_review: {
			findUnique: jest.fn(),
			update: jest.fn(),
			create: jest.fn(),
		},
		orders: {
			findFirst: jest.fn(),
		},
		ordered_item: {
			findFirst: jest.fn(),
		},
	})),
	Prisma: {},
}));

// Mock helper modules
jest.mock("../../src/helper/common.js", () => ({
	response: jest.fn((res, result, status, message) => {
		res.status(status).json({
			status: "Success",
			statusCode: status,
			data: result,
			message: message || null,
		});
	}),
}));

describe("User Rating Products Controller", () => {
	let mockReq, mockRes, mockNext;
	let prismaInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			body: {},
			params: {},
			query: {},
			session: { id: "user-id-123" },
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();

		const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
		prismaInstance = new MockedPrismaClient();
	});

	describe("RateProduct", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;
			mockReq.params = { id: "1" };

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if required fields are missing", async () => {
			mockReq.body = { rating: 5 };
			mockReq.params = { id: "1" };

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.body = { rating: 5, comment: "Great product" };
			mockReq.params = { id: "invalid" };

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if rating is out of range", async () => {
			mockReq.body = { rating: 10, comment: "Great product" };
			mockReq.params = { id: "1" };

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if user has not purchased the product", async () => {
			mockReq.body = { rating: 5, comment: "Great product" };
			mockReq.params = { id: "1" };
			prismaInstance.ordered_item.findFirst.mockResolvedValue(null);

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully create product review", async () => {
			mockReq.body = { rating: 5, comment: "Great product" };
			mockReq.params = { id: "1" };
			const mockOrderedItem = {
				product_id: 1,
				quantity: 2,
			};
			const mockProduct = {
				id: 1,
				total_reviews: 5,
				average_rating: 4.2,
			};
			const mockReview = {
				id: 1,
				product_id: 1,
				user_id: "user-id-123",
				rating: 5,
				comment: "Great product",
			};
			prismaInstance.ordered_item.findFirst.mockResolvedValue(mockOrderedItem);
			prismaInstance.products.findUnique.mockResolvedValue(mockProduct);
			prismaInstance.product_review.create.mockResolvedValue(mockReview);

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.product_review.create).toHaveBeenCalled();
		});

		it("should return 400 if user already reviewed the product", async () => {
			mockReq.body = { rating: 5, comment: "Great product" };
			mockReq.params = { id: "1" };
			const mockOrderedItem = {
				product_id: 1,
				quantity: 2,
			};
			prismaInstance.ordered_item.findFirst.mockResolvedValue(mockOrderedItem);
			prismaInstance.product_review.findUnique.mockResolvedValue({
				id: 1,
				product_id: 1,
				user_id: "user-id-123",
			});

			await userRatingProductsController.RateProduct(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("MarkHelpfulOrNot", () => {
		it("should return 400 if rating parameter is invalid", async () => {
			mockReq.params = { id: "1", rate: "invalid" };

			await userRatingProductsController.MarkHelpfulOrNot(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if review ID is invalid", async () => {
			mockReq.params = { id: "invalid", rate: "helpful" };

			await userRatingProductsController.MarkHelpfulOrNot(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if review not found", async () => {
			mockReq.params = { id: "999", rate: "helpful" };
			prismaInstance.product_review.findUnique.mockResolvedValue(null);

			await userRatingProductsController.MarkHelpfulOrNot(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(404);
		});

		it("should successfully mark review as helpful", async () => {
			mockReq.params = { id: "1", rate: "helpful" };
			const mockReview = {
				id: 1,
				product_id: 1,
			};
			const mockHelpfulReview = {
				id: 1,
				review_id: 1,
				user_id: "user-id-123",
				is_helpful: true,
			};
			prismaInstance.product_review.findUnique.mockResolvedValue(mockReview);
			prismaInstance.helpful_review.findUnique.mockResolvedValue(null);
			prismaInstance.helpful_review.create.mockResolvedValue(mockHelpfulReview);

			await userRatingProductsController.MarkHelpfulOrNot(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.helpful_review.create).toHaveBeenCalled();
		});

		it("should successfully mark review as not helpful", async () => {
			mockReq.params = { id: "1", rate: "not-helpful" };
			const mockReview = {
				id: 1,
				product_id: 1,
			};
			const mockHelpfulReview = {
				id: 1,
				review_id: 1,
				user_id: "user-id-123",
				is_helpful: false,
			};
			prismaInstance.product_review.findUnique.mockResolvedValue(mockReview);
			prismaInstance.helpful_review.findUnique.mockResolvedValue(null);
			prismaInstance.helpful_review.create.mockResolvedValue(mockHelpfulReview);

			await userRatingProductsController.MarkHelpfulOrNot(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.helpful_review.create).toHaveBeenCalled();
		});

		it("should update existing helpful review", async () => {
			mockReq.params = { id: "1", rate: "helpful" };
			const mockReview = {
				id: 1,
				product_id: 1,
			};
			const existingHelpfulReview = {
				id: 1,
				review_id: 1,
				user_id: "user-id-123",
				is_helpful: false,
			};
			const updatedHelpfulReview = {
				...existingHelpfulReview,
				is_helpful: true,
			};
			prismaInstance.product_review.findUnique.mockResolvedValue(mockReview);
			prismaInstance.helpful_review.findUnique.mockResolvedValue(
				existingHelpfulReview,
			);
			prismaInstance.helpful_review.update.mockResolvedValue(
				updatedHelpfulReview,
			);

			await userRatingProductsController.MarkHelpfulOrNot(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.helpful_review.update).toHaveBeenCalled();
		});
	});
});
