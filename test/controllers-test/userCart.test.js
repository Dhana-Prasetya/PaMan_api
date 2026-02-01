const userCartControllers = require("../../src/controllers/userCartControllers");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		carts: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		carts_items: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			deleteMany: jest.fn(),
		},
		products: {
			findUnique: jest.fn(),
		},
		orders: {
			create: jest.fn(),
		},
		ordered_item: {
			createMany: jest.fn(),
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

jest.mock("../../src/helper/productQuantityCheck.js");
jest.mock("../../src/helper/cacheInvalidation.js");

describe("User Cart Controllers", () => {
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

	describe("GetUserCart", () => {
		it("should return user cart with items", async () => {
			const mockCart = {
				id: 1,
				user_id: "user-id-123",
				carts_items: [
					{
						id: 1,
						product_id: 1,
						quantity: 2,
						products: { id: 1, name: "Product1", price: 100 },
					},
				],
			};
			prismaInstance.carts.findUnique.mockResolvedValue(mockCart);

			await userCartControllers.GetUserCart(mockReq, mockRes, mockNext);

			expect(prismaInstance.carts.findUnique).toHaveBeenCalledWith({
				where: { user_id: "user-id-123" },
				include: expect.any(Object),
			});
		});

		it("should create a new cart if none exists", async () => {
			const mockNewCart = {
				id: 1,
				user_id: "user-id-123",
				carts_items: [],
			};
			prismaInstance.carts.findUnique.mockResolvedValue(null);
			prismaInstance.carts.create.mockResolvedValue(mockNewCart);

			await userCartControllers.GetUserCart(mockReq, mockRes, mockNext);

			expect(prismaInstance.carts.create).toHaveBeenCalled();
		});
	});

	describe("AddProductToCart", () => {
		it("should add product to cart", async () => {
			mockReq.params = { id: "1" };
			mockReq.body = { quantity: 2 };
			const mockProduct = { id: 1, price: 100, stock: 10 };
			const mockCartItem = { id: 1, product_id: 1, quantity: 2 };
			prismaInstance.products.findUnique.mockResolvedValue(mockProduct);
			prismaInstance.carts_items.create.mockResolvedValue(mockCartItem);

			await userCartControllers.AddProductToCart(mockReq, mockRes, mockNext);

			expect(prismaInstance.products.findUnique).toHaveBeenCalled();
			expect(prismaInstance.carts_items.create).toHaveBeenCalled();
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.params = { id: "invalid" };
			mockReq.body = { quantity: 2 };

			await userCartControllers.AddProductToCart(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if quantity is missing", async () => {
			mockReq.params = { id: "1" };
			mockReq.body = {};

			await userCartControllers.AddProductToCart(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("DecreaseProductQuantityFromCart", () => {
		it("should decrease product quantity in cart", async () => {
			mockReq.params = { id: "1" };
			mockReq.body = { quantity: 1 };
			const mockCartItem = { id: 1, quantity: 1 };
			prismaInstance.carts_items.update.mockResolvedValue(mockCartItem);

			await userCartControllers.DecreaseProductQuantityFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.carts_items.update).toHaveBeenCalled();
		});

		it("should return 400 if product ID is invalid", async () => {
			mockReq.params = { id: "invalid" };
			mockReq.body = { quantity: 1 };

			await userCartControllers.DecreaseProductQuantityFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("RemoveMultipleProductFromCart", () => {
		it("should remove multiple products from cart", async () => {
			mockReq.body = { productIds: [1, 2, 3] };
			prismaInstance.carts_items.deleteMany.mockResolvedValue({ count: 3 });

			await userCartControllers.RemoveMultipleProductFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.carts_items.deleteMany).toHaveBeenCalled();
		});

		it("should return 400 if product IDs is missing", async () => {
			mockReq.body = {};

			await userCartControllers.RemoveMultipleProductFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("CheckoutProductFromCart", () => {
		it("should create order from cart items", async () => {
			mockReq.body = { addressId: 1 };
			const mockCart = {
				user_id: "user-id-123",
				carts_items: [
					{
						product_id: 1,
						quantity: 2,
						products: { price: 100 },
					},
				],
			};
			const mockOrder = { id: 1, user_id: "user-id-123", total_price: 200 };
			prismaInstance.carts.findUnique.mockResolvedValue(mockCart);
			prismaInstance.orders.create.mockResolvedValue(mockOrder);

			await userCartControllers.CheckoutProductFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.orders.create).toHaveBeenCalled();
		});

		it("should return 400 if address ID is missing", async () => {
			mockReq.body = {};

			await userCartControllers.CheckoutProductFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if cart is empty", async () => {
			mockReq.body = { addressId: 1 };
			const mockEmptyCart = {
				user_id: "user-id-123",
				carts_items: [],
			};
			prismaInstance.carts.findUnique.mockResolvedValue(mockEmptyCart);

			await userCartControllers.CheckoutProductFromCart(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});
});
