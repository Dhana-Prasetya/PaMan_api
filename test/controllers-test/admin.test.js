const adminControllers = require("../../src/controllers/adminControllers");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		admin: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			update: jest.fn(),
		},
		users: {
			findMany: jest.fn(),
		},
		products: {
			findMany: jest.fn(),
		},
		orders: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			updateMany: jest.fn(),
			deleteMany: jest.fn(),
		},
	})),
	Prisma: {},
}));

// Mock JWT
jest.mock("jsonwebtoken");

// Mock bcryptjs
jest.mock("bcryptjs");

// Mock helper modules
jest.mock("../../src/helper/auth.js", () => ({
	generateToken: jest.fn(() => "mock_token"),
}));

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

jest.mock("../../src/helper/redisClient.js", () => ({
	get: jest.fn(),
	set: jest.fn(),
	del: jest.fn(),
}));

jest.mock("../../src/helper/getRemainingTokenLifetime.js");
jest.mock("../../src/helper/paginationCheck.js");
jest.mock("../../src/helper/pagination.js");
jest.mock("../../src/helper/cacheInvalidation.js");

describe("Admin Controllers", () => {
	let mockReq, mockRes, mockNext;
	let prismaInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup mock request and response
		mockReq = {
			body: {},
			session: {},
			params: {},
			query: {},
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			cookie: jest.fn().mockReturnThis(),
			clearCookie: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();

		// Get mocked Prisma instance
		const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
		prismaInstance = new MockedPrismaClient();
	});

	describe("Login", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Request body is missing !",
			});
		});

		it("should return 400 if email or password is missing", async () => {
			mockReq.body = { email: "test@example.com" };

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Email and password are required !",
			});
		});

		it("should return 400 if email is invalid", async () => {
			mockReq.body = { email: "invalid-email", password: "password123" };

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Email are not valid !",
			});
		});

		it("should return 400 if email or password is too long", async () => {
			mockReq.body = {
				email: "test@example.com",
				password: "x".repeat(300),
			};

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if admin not found", async () => {
			mockReq.body = { email: "admin@example.com", password: "password123" };
			prismaInstance.admin.findUnique.mockResolvedValue(null);

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if password is incorrect", async () => {
			const mockAdmin = {
				id: "admin-id-123",
				email: "admin@example.com",
				password: "hashed_password",
			};
			mockReq.body = { email: "admin@example.com", password: "wrong_password" };
			prismaInstance.admin.findUnique.mockResolvedValue(mockAdmin);
			bcrypt.compare.mockResolvedValue(false);

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully login and return token", async () => {
			const mockAdmin = {
				id: "admin-id-123",
				email: "admin@example.com",
				password: "hashed_password",
				username: "admin",
			};
			mockReq.body = { email: "admin@example.com", password: "password123" };
			prismaInstance.admin.findUnique.mockResolvedValue(mockAdmin);
			bcrypt.compare.mockResolvedValue(true);

			await adminControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
			expect(mockRes.cookie).toHaveBeenCalled();
		});
	});

	describe("Logout", () => {
		it("should successfully logout and clear cookie", async () => {
			mockReq.session = { id: "admin-id-123" };

			await adminControllers.Logout(mockReq, mockRes, mockNext);

			expect(mockRes.clearCookie).toHaveBeenCalled();
		});
	});

	describe("ListOfEveryUserPaginated", () => {
		it("should return paginated list of users", async () => {
			mockReq.query = { page: "1", limit: "10" };
			const mockUsers = [
				{ id: "user1", username: "john" },
				{ id: "user2", username: "jane" },
			];
			prismaInstance.users.findMany.mockResolvedValue(mockUsers);

			await adminControllers.ListOfEveryUserPaginated(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.users.findMany).toHaveBeenCalled();
		});

		it("should return 400 if pagination parameters are invalid", async () => {
			mockReq.query = { page: "invalid", limit: "10" };

			await adminControllers.ListOfEveryUserPaginated(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("GetTop3ProductsAndCategory", () => {
		it("should return top 3 products grouped by category", async () => {
			const mockProducts = [
				{ id: 1, name: "Product1", category: "Electronics" },
				{ id: 2, name: "Product2", category: "Electronics" },
				{ id: 3, name: "Product3", category: "Clothing" },
			];
			prismaInstance.products.findMany.mockResolvedValue(mockProducts);

			await adminControllers.GetTop3ProductsAndCategory(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.products.findMany).toHaveBeenCalled();
		});
	});

	describe("GetPaginatedUserOrders", () => {
		it("should return paginated list of orders", async () => {
			mockReq.query = { page: "1", limit: "10" };
			const mockOrders = [
				{ id: 1, user_id: "user1", total_price: 100 },
				{ id: 2, user_id: "user2", total_price: 200 },
			];
			prismaInstance.orders.findMany.mockResolvedValue(mockOrders);

			await adminControllers.GetPaginatedUserOrders(mockReq, mockRes, mockNext);

			expect(prismaInstance.orders.findMany).toHaveBeenCalled();
		});
	});

	describe("GetUserOrderDetail", () => {
		it("should return order details by ID", async () => {
			mockReq.params = { id: "1" };
			const mockOrder = {
				id: 1,
				user_id: "user1",
				total_price: 100,
				ordered_item: [{ product_id: 1, quantity: 2 }],
			};
			prismaInstance.orders.findUnique.mockResolvedValue(mockOrder);

			await adminControllers.GetUserOrderDetail(mockReq, mockRes, mockNext);

			expect(prismaInstance.orders.findUnique).toHaveBeenCalledWith({
				where: { id: 1 },
				include: expect.any(Object),
			});
		});

		it("should return 404 if order not found", async () => {
			mockReq.params = { id: "999" };
			prismaInstance.orders.findUnique.mockResolvedValue(null);

			await adminControllers.GetUserOrderDetail(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(404);
		});
	});

	describe("ChangeMultipleUserOrdersStatus", () => {
		it("should update multiple orders status", async () => {
			mockReq.body = {
				orderIds: [1, 2, 3],
				newStatus: "delivered",
			};
			prismaInstance.orders.updateMany.mockResolvedValue({ count: 3 });

			await adminControllers.ChangeMultipleUserOrdersStatus(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.orders.updateMany).toHaveBeenCalled();
		});

		it("should return 400 if order IDs or status is missing", async () => {
			mockReq.body = { orderIds: [1, 2] };

			await adminControllers.ChangeMultipleUserOrdersStatus(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("DeleteMultipleOrders", () => {
		it("should delete multiple orders", async () => {
			mockReq.body = { orderIds: [1, 2, 3] };
			prismaInstance.orders.deleteMany.mockResolvedValue({ count: 3 });

			await adminControllers.DeleteMultipleOrders(mockReq, mockRes, mockNext);

			expect(prismaInstance.orders.deleteMany).toHaveBeenCalled();
		});

		it("should return 400 if order IDs is missing", async () => {
			mockReq.body = {};

			await adminControllers.DeleteMultipleOrders(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});
});
