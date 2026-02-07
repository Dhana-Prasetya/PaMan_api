const userAdressControllers = require("../../src/controllers/userAdressControllers");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		user_address: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		users: {
			findUnique: jest.fn(),
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

jest.mock("../../src/helper/userAddressInputCheck.js");

describe("User Address Controllers", () => {
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

	describe("AddUserAddress", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await userAdressControllers.AddUserAddress(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if required fields are missing", async () => {
			mockReq.body = { recipient_name: "John" };

			await userAdressControllers.AddUserAddress(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully add a user address", async () => {
			const mockAddress = {
				id: 1,
				user_id: "user-id-123",
				recipient_name: "John Doe",
				street: "123 Main St",
				city: "Jakarta",
				province: "DKI Jakarta",
				kecamatan: "Menteng",
				postal_code: "12160",
				detail: "Apt 4B",
				is_default: false,
			};
			mockReq.body = {
				recipient_name: "John Doe",
				street: "123 Main St",
				city: "Jakarta",
				province: "DKI Jakarta",
				kecamatan: "Menteng",
				postal_code: "12160",
				detail: "Apt 4B",
			};
			prismaInstance.user_address.create.mockResolvedValue(mockAddress);

			await userAdressControllers.AddUserAddress(mockReq, mockRes, mockNext);

			expect(prismaInstance.user_address.create).toHaveBeenCalled();
		});
	});

	describe("GetUserAddresses", () => {
		it("should return all user addresses", async () => {
			const mockAddresses = [
				{
					id: 1,
					user_id: "user-id-123",
					recipient_name: "John Doe",
					city: "Jakarta",
					is_default: true,
				},
				{
					id: 2,
					user_id: "user-id-123",
					recipient_name: "Jane Doe",
					city: "Bandung",
					is_default: false,
				},
			];
			prismaInstance.user_address.findMany.mockResolvedValue(mockAddresses);

			await userAdressControllers.GetUserAddresses(mockReq, mockRes, mockNext);

			expect(prismaInstance.user_address.findMany).toHaveBeenCalledWith({
				where: { user_id: "user-id-123" },
			});
		});
	});

	describe("UpdateUserAddresses", () => {
		it("should successfully update a user address", async () => {
			mockReq.params = { id: "1" };
			mockReq.body = {
				recipient_name: "Jane Doe",
				street: "456 Oak Ave",
			};
			const mockAddress = {
				id: 1,
				user_id: "user-id-123",
				recipient_name: "Jane Doe",
				street: "456 Oak Ave",
			};
			prismaInstance.user_address.update.mockResolvedValue(mockAddress);

			await userAdressControllers.UpdateUserAddresses(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.user_address.update).toHaveBeenCalled();
		});

		it("should return 400 if address ID is invalid", async () => {
			mockReq.params = { id: "invalid" };
			mockReq.body = { recipient_name: "Jane Doe" };

			await userAdressControllers.UpdateUserAddresses(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("SetDefaultUserAddresses", () => {
		it("should set an address as default", async () => {
			mockReq.params = { id: "1" };
			const mockAddress = {
				id: 1,
				user_id: "user-id-123",
				is_default: true,
			};
			prismaInstance.user_address.update.mockResolvedValue(mockAddress);

			await userAdressControllers.SetDefaultUserAddresses(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.user_address.update).toHaveBeenCalled();
		});

		it("should return 400 if address ID is invalid", async () => {
			mockReq.params = { id: "invalid" };

			await userAdressControllers.SetDefaultUserAddresses(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("DeleteUserAddresses", () => {
		it("should successfully delete a user address", async () => {
			mockReq.params = { id: "1" };
			prismaInstance.user_address.delete.mockResolvedValue({ id: 1 });

			await userAdressControllers.DeleteUserAddresses(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.user_address.delete).toHaveBeenCalledWith({
				where: { id: 1 },
			});
		});

		it("should return 400 if address ID is invalid", async () => {
			mockReq.params = { id: "invalid" };

			await userAdressControllers.DeleteUserAddresses(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});
});
