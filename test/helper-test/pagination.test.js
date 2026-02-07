const pagination = require("../../src/helper/pagination");
const { PrismaClient } = require("@prisma/client");

jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		users: {
			count: jest.fn(),
		},
		products: {
			count: jest.fn(),
		},
		orders: {
			count: jest.fn(),
		},
	})),
}));

describe("Helper - pagination", () => {
	let mockPrisma;

	beforeEach(() => {
		jest.clearAllMocks();
		const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
		mockPrisma = new MockedPrismaClient();
	});

	it("should calculate correct skip for page 1", async () => {
		mockPrisma.users.count.mockResolvedValue(100);

		const result = await pagination({ page: 1, limit: 10, table: "users" });

		expect(result.skip).toBe(0);
	});

	it("should calculate correct skip for page 2", async () => {
		mockPrisma.users.count.mockResolvedValue(100);

		const result = await pagination({ page: 2, limit: 10, table: "users" });

		expect(result.skip).toBe(10);
	});

	it("should calculate correct skip for page 3", async () => {
		mockPrisma.users.count.mockResolvedValue(100);

		const result = await pagination({ page: 3, limit: 25, table: "users" });

		expect(result.skip).toBe(50);
	});

	it("should return total count from database", async () => {
		mockPrisma.products.count.mockResolvedValue(50);

		const result = await pagination({ page: 1, limit: 10, table: "products" });

		expect(result.total).toBe(50);
	});

	it("should calculate correct total pages", async () => {
		mockPrisma.users.count.mockResolvedValue(100);

		const result = await pagination({ page: 1, limit: 10, table: "users" });

		expect(result.totalPages).toBe(10);
	});

	it("should round up total pages correctly", async () => {
		mockPrisma.orders.count.mockResolvedValue(105);

		const result = await pagination({ page: 1, limit: 10, table: "orders" });

		expect(result.totalPages).toBe(11);
	});

	it("should handle edge case with 0 total records", async () => {
		mockPrisma.users.count.mockResolvedValue(0);

		const result = await pagination({ page: 1, limit: 10, table: "users" });

		expect(result.skip).toBe(0);
		expect(result.total).toBe(0);
		expect(result.totalPages).toBe(0);
	});

	it("should handle exact division of records", async () => {
		mockPrisma.products.count.mockResolvedValue(100);

		const result = await pagination({ page: 1, limit: 20, table: "products" });

		expect(result.totalPages).toBe(5);
	});

	it("should work with different table names", async () => {
		mockPrisma.orders.count.mockResolvedValue(150);

		const result = await pagination({
			page: 2,
			limit: 30,
			table: "orders",
		});

		expect(mockPrisma.orders.count).toHaveBeenCalled();
		expect(result.skip).toBe(30);
		expect(result.totalPages).toBe(5);
	});

	it("should handle single record", async () => {
		mockPrisma.users.count.mockResolvedValue(1);

		const result = await pagination({ page: 1, limit: 10, table: "users" });

		expect(result.totalPages).toBe(1);
	});

	it("should handle large page numbers", async () => {
		mockPrisma.users.count.mockResolvedValue(1000);

		const result = await pagination({ page: 50, limit: 10, table: "users" });

		expect(result.skip).toBe(490);
	});

	it("should work with limit of 1", async () => {
		mockPrisma.products.count.mockResolvedValue(50);

		const result = await pagination({ page: 1, limit: 1, table: "products" });

		expect(result.skip).toBe(0);
		expect(result.totalPages).toBe(50);
	});

	it("should work with large limit", async () => {
		mockPrisma.users.count.mockResolvedValue(50);

		const result = await pagination({
			page: 1,
			limit: 100,
			table: "users",
		});

		expect(result.skip).toBe(0);
		expect(result.totalPages).toBe(1);
	});

	it("should return object with all required properties", async () => {
		mockPrisma.users.count.mockResolvedValue(100);

		const result = await pagination({ page: 1, limit: 10, table: "users" });

		expect(result).toHaveProperty("skip");
		expect(result).toHaveProperty("total");
		expect(result).toHaveProperty("totalPages");
	});
});
