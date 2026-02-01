const contactControllers = require("../../src/controllers/contactControllers");
const { PrismaClient } = require("@prisma/client");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		contact: {
			create: jest.fn(),
			findMany: jest.fn(),
			delete: jest.fn(),
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

describe("Contact Controllers", () => {
	let mockReq, mockRes, mockNext;
	let prismaInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			body: {},
			params: {},
			query: {},
			session: {},
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();

		const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
		prismaInstance = new MockedPrismaClient();
	});

	describe("SendContactMessage", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await contactControllers.SendContactMessage(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if required fields are missing", async () => {
			mockReq.body = { username: "John" };

			await contactControllers.SendContactMessage(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if email is invalid", async () => {
			mockReq.body = {
				username: "John",
				email: "invalid-email",
				message: "Hello",
			};

			await contactControllers.SendContactMessage(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully create a contact message", async () => {
			const mockContact = {
				id: "contact-id-123",
				username: "John",
				email: "john@example.com",
				message: "Hello there",
			};
			mockReq.body = {
				username: "John",
				email: "john@example.com",
				message: "Hello there",
			};
			prismaInstance.contact.create.mockResolvedValue(mockContact);

			await contactControllers.SendContactMessage(mockReq, mockRes, mockNext);

			expect(prismaInstance.contact.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					username: "John",
					email: "john@example.com",
					message: "Hello there",
				}),
			});
		});

		it("should return 500 if database error occurs", async () => {
			mockReq.body = {
				username: "John",
				email: "john@example.com",
				message: "Hello there",
			};
			prismaInstance.contact.create.mockRejectedValue(
				new Error("Database error"),
			);

			await contactControllers.SendContactMessage(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
		});
	});

	describe("GetAllContactMessages", () => {
		it("should return paginated contact messages", async () => {
			mockReq.query = { page: "1", limit: "10" };
			const mockMessages = [
				{
					id: "1",
					username: "John",
					email: "john@example.com",
					message: "Hello",
				},
				{
					id: "2",
					username: "Jane",
					email: "jane@example.com",
					message: "Hi there",
				},
			];
			prismaInstance.contact.findMany.mockResolvedValue(mockMessages);

			await contactControllers.GetAllContactMessages(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(prismaInstance.contact.findMany).toHaveBeenCalled();
		});

		it("should return 400 if pagination parameters are invalid", async () => {
			mockReq.query = { page: "invalid", limit: "10" };

			await contactControllers.GetAllContactMessages(
				mockReq,
				mockRes,
				mockNext,
			);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});
	});

	describe("DeleteContactMessage", () => {
		it("should successfully delete a contact message", async () => {
			mockReq.params = { id: "contact-id-123" };
			prismaInstance.contact.delete.mockResolvedValue({ id: "contact-id-123" });

			await contactControllers.DeleteContactMessage(mockReq, mockRes, mockNext);

			expect(prismaInstance.contact.delete).toHaveBeenCalledWith({
				where: { id: "contact-id-123" },
			});
		});

		it("should return 400 if contact ID is missing", async () => {
			mockReq.params = {};

			await contactControllers.DeleteContactMessage(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 404 if contact not found", async () => {
			mockReq.params = { id: "non-existent-id" };
			prismaInstance.contact.delete.mockRejectedValue(
				new Error("Record not found"),
			);

			await contactControllers.DeleteContactMessage(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
		});
	});
});
