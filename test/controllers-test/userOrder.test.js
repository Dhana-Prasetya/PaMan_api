const userOrderControllers = require("../../src/controllers/userOrderControllers");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		orders: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
		},
		ordered_item: {
			createMany: jest.fn(),
		},
		products: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		carts: {
			findUnique: jest.fn(),
		},
		carts_items: {
			deleteMany: jest.fn(),
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
jest.mock("../../src/helper/productQuantityCheck.js");
jest.mock("../../src/helper/orderQuantityCheck.js");

describe("User Order Controllers", () => {
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

	describe("OrderProductDirectly", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await userOrderControllers.OrderProductDirectly(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if required fields are missing", async () => {
			mockReq.body = { productId: 1 };

			await userOrderControllers.OrderProductDirectly(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.body = { productId: "invalid", quantity: 2, addressId: 1 };

			await userOrderControllers.OrderProductDirectly(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully create direct order", async () => {
			mockReq.body = { productId: 1, quantity: 2, addressId: 1 };
			const mockProduct = {
				id: 1,
				name: "Product1",
				price: 100,
				stock: 10,
			};
			const mockOrder = {
				id: 1,
				user_id: "user-id-123",
				total_price: 200,
			};
			prismaInstance.products.findUnique.mockResolvedValue(mockProduct);
			prismaInstance.orders.create.mockResolvedValue(mockOrder);

			await userOrderControllers.OrderProductDirectly(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.orders.create).toHaveBeenCalled();
		});

		it("should return 400 if product not found", async () => {
			mockReq.body = { productId: 999, quantity: 2, addressId: 1 };
			prismaInstance.products.findUnique.mockResolvedValue(null);

			await userOrderControllers.OrderProductDirectly(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if product stock is insufficient", async () => {
			mockReq.body = { productId: 1, quantity: 100, addressId: 1 };
			const mockProduct = {
				id: 1,
				name: "Product1",
				price: 100,
				stock: 5,
			};
			prismaInstance.products.findUnique.mockResolvedValue(mockProduct);

			await userOrderControllers.OrderProductDirectly(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("GetPaginatedMyOrders", () => {
		it("should return paginated orders for user", async () => {
			mockReq.query = { page: "1", limit: "10" };
			const mockOrders = [
				{ id: 1, user_id: "user-id-123", total_price: 200 },
				{ id: 2, user_id: "user-id-123", total_price: 300 },
			];
			prismaInstance.orders.findMany.mockResolvedValue(mockOrders);

			await userOrderControllers.GetPaginatedMyOrders(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.orders.findMany).toHaveBeenCalled();
		});

		it("should return 400 if pagination parameters are invalid", async () => {
			mockReq.query = { page: "invalid", limit: "10" };

			await userOrderControllers.GetPaginatedMyOrders(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("GetMyDetailOrder", () => {
		it("should return detailed order information", async () => {
			mockReq.params = { id: "1" };
			const mockOrder = {
				id: 1,
				user_id: "user-id-123",
				total_price: 200,
				ordered_item: [{ product_id: 1, quantity: 2 }],
				user_address: { city: "Jakarta" },
			};
			prismaInstance.orders.findUnique.mockResolvedValue(mockOrder);

			await userOrderControllers.GetMyDetailOrder(mockReq, mockRes, mockNext);

			expect(prismaInstance.orders.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: expect.any(Object),
			});
		});

		it("should return 400 if order ID is invalid", async () => {
			mockReq.params = { id: "invalid" };

			await userOrderControllers.GetMyDetailOrder(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if order not found", async () => {
			mockReq.params = { id: "999" };
			prismaInstance.orders.findUnique.mockResolvedValue(null);

			await userOrderControllers.GetMyDetailOrder(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(404);
		});

		it("should return 403 if order does not belong to user", async () => {
			mockReq.params = { id: "1" };
			const mockOrder = {
				id: 1,
				user_id: "different-user-id",
				total_price: 200,
			};
			prismaInstance.orders.findUnique.mockResolvedValue(mockOrder);

			await userOrderControllers.GetMyDetailOrder(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(403);
		});
	});
});
