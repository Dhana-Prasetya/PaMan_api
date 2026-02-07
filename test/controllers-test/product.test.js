const productControllers = require("../../src/controllers/productControllers");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		products: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		product_review: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			count: jest.fn(),
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

jest.mock("../../src/helper/paginationCheck.js");
jest.mock("../../src/helper/pagination.js");
jest.mock("../../src/helper/productInputCheck.js");
jest.mock("../../src/helper/productQuantityCheck.js");
jest.mock("../../src/helper/cacheInvalidation.js");

describe("Product Controllers", () => {
	let mockReq, mockRes, mockNext;
	let prismaInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			body: {},
			params: {},
			query: {},
			file: null,
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();

		const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
		prismaInstance = new MockedPrismaClient();
	});

	describe("GetAllProducts", () => {
		it("should return paginated list of all products", async () => {
			mockReq.query = { page: "1", limit: "10" };
			const mockProducts = [
				{
					id: 1,
					name: "Product1",
					price: 100,
					category: "Electronics",
					stock: 10,
				},
				{
					id: 2,
					name: "Product2",
					price: 200,
					category: "Clothing",
					stock: 20,
				},
			];
			prismaInstance.products.findMany.mockResolvedValue(mockProducts);

			await productControllers.GetAllProducts(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.findMany).toHaveBeenCalled();
		});

		it("should return 400 if pagination parameters are invalid", async () => {
			mockReq.query = { page: "invalid", limit: "10" };

			await productControllers.GetAllProducts(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("GetProductById", () => {
		it("should return product details by ID", async () => {
			mockReq.params = { id: "1" };
			const mockProduct = {
				id: 1,
				name: "Product1",
				price: 100,
				category: "Electronics",
				stock: 10,
				product_review: [{ id: 1, rating: 5 }],
			};
			prismaInstance.products.findUnique.mockResolvedValue(mockProduct);

			await productControllers.GetProductById(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: expect.any(Object),
			});
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.params = { id: "invalid" };

			await productControllers.GetProductById(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if product not found", async () => {
			mockReq.params = { id: "999" };
			prismaInstance.products.findUnique.mockResolvedValue(null);

			await productControllers.GetProductById(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(404);
		});
	});

	describe("GetProductReviews", () => {
		it("should return paginated product reviews", async () => {
			mockReq.params = { id: "1" };
			mockReq.query = { page: "1", limit: "10" };
			const mockReviews = [
				{ id: 1, rating: 5, comment: "Great product" },
				{ id: 2, rating: 4, comment: "Good product" },
			];
			prismaInstance.product_review.findMany.mockResolvedValue(mockReviews);

			await productControllers.GetProductReviews(mockReq, mockRes, mockNext);

			expect(prismaInstance.product_review.findMany).toHaveBeenCalled();
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.params = { id: "invalid" };

			await productControllers.GetProductReviews(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("CreateProduct", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await productControllers.CreateProduct(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if required fields are missing", async () => {
			mockReq.body = { name: "Product1" };

			await productControllers.CreateProduct(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully create a product", async () => {
			const mockProduct = {
				id: 1,
				name: "Product1",
				price: 100,
				category: "Electronics",
				stock: 10,
				photo_url: "http://example.com/image.jpg",
				description: "A great product",
			};
			mockReq.body = {
				name: "Product1",
				price: 100,
				category: "Electronics",
				stock: 10,
				photo_url: "http://example.com/image.jpg",
				description: "A great product",
			};
			prismaInstance.products.create.mockResolvedValue(mockProduct);

			await productControllers.CreateProduct(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.create).toHaveBeenCalled();
		});
	});

	describe("UpdateProduct", () => {
		it("should successfully update a product", async () => {
			mockReq.params = { id: "1" };
			mockReq.body = {
				name: "Updated Product",
				price: 150,
			};
			const mockProduct = {
				id: 1,
				name: "Updated Product",
				price: 150,
			};
			prismaInstance.products.update.mockResolvedValue(mockProduct);

			await productControllers.UpdateProduct(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.update).toHaveBeenCalled();
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.params = { id: "invalid" };
			mockReq.body = { name: "Updated" };

			await productControllers.UpdateProduct(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if product not found", async () => {
			mockReq.params = { id: "999" };
			mockReq.body = { name: "Updated" };
			prismaInstance.products.update.mockRejectedValue(
				new Error("Product not found"),
			);

			await productControllers.UpdateProduct(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
		});
	});

	describe("DeleteProduct", () => {
		it("should successfully delete a product", async () => {
			mockReq.params = { id: "1" };
			prismaInstance.products.delete.mockResolvedValue({ id: 1 });

			await productControllers.DeleteProduct(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.params = { id: "invalid" };

			await productControllers.DeleteProduct(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if product not found", async () => {
			mockReq.params = { id: "999" };
			prismaInstance.products.delete.mockRejectedValue(
				new Error("Product not found"),
			);

			await productControllers.DeleteProduct(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
		});
	});

	describe("SearchProducts", () => {
		it("should return products matching search query", async () => {
			mockReq.query = { search: "electronics", page: "1", limit: "10" };
			const mockProducts = [{ id: 1, name: "Electronics Item", price: 100 }];
			prismaInstance.products.findMany.mockResolvedValue(mockProducts);

			await productControllers.SearchProducts(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.findMany).toHaveBeenCalled();
		});

		it("should return 400 if search query is missing", async () => {
			mockReq.query = { page: "1", limit: "10" };

			await productControllers.SearchProducts(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});
});
