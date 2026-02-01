const userControllers = require("../../src/controllers/userControllers");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary");

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
	PrismaClient: jest.fn(() => ({
		users: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		carts: {
			create: jest.fn(),
		},
	})),
	Prisma: {},
}));

// Mock bcryptjs
jest.mock("bcryptjs");

// Mock cloudinary
jest.mock("cloudinary");

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

jest.mock("../../src/helper/capitalizeFirstLetter.js");
jest.mock("../../src/helper/userProfileInputCheck.js");
jest.mock("../../src/helper/getCloudinaryPublicId.js");

describe("User Controllers", () => {
	let mockReq, mockRes, mockNext;
	let prismaInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			body: {},
			params: {},
			query: {},
			session: { id: "user-id-123" },
			file: null,
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			cookie: jest.fn().mockReturnThis(),
			clearCookie: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();

		const { PrismaClient: MockedPrismaClient } = require("@prisma/client");
		prismaInstance = new MockedPrismaClient();
	});

	describe("Register", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await userControllers.Register(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if required fields are missing", async () => {
			mockReq.body = { username: "john" };

			await userControllers.Register(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if email is invalid", async () => {
			mockReq.body = {
				username: "john",
				email: "invalid-email",
				password: "pass123",
				full_name: "John Doe",
				phone_number: "08123456789",
				gender: "Male",
				birthday: "2000-01-01",
			};

			await userControllers.Register(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully register a new user", async () => {
			const mockUser = {
				id: "user-id-123",
				username: "john",
				email: "john@example.com",
				full_name: "John Doe",
				phone_number: "08123456789",
			};
			mockReq.body = {
				username: "john",
				email: "john@example.com",
				password: "password123",
				full_name: "John Doe",
				phone_number: "08123456789",
				gender: "Male",
				birthday: "2000-01-01",
			};
			bcrypt.hash.mockResolvedValue("hashed_password");
			prismaInstance.users.create.mockResolvedValue(mockUser);
			prismaInstance.carts.create.mockResolvedValue({
				user_id: "user-id-123",
			});

			await userControllers.Register(mockReq, mockRes, mockNext);

			expect(prismaInstance.users.create).toHaveBeenCalled();
		});

		it("should return 400 if user already exists", async () => {
			mockReq.body = {
				username: "john",
				email: "john@example.com",
				password: "password123",
				full_name: "John Doe",
				phone_number: "08123456789",
				gender: "Male",
				birthday: "2000-01-01",
			};
			bcrypt.hash.mockResolvedValue("hashed_password");
			prismaInstance.users.create.mockRejectedValue(
				new Error("Unique constraint failed"),
			);

			await userControllers.Register(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
		});
	});

	describe("Login", () => {
		it("should return 400 if email or password is missing", async () => {
			mockReq.body = { email: "john@example.com" };

			await userControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if user not found", async () => {
			mockReq.body = {
				email: "john@example.com",
				password: "password123",
			};
			prismaInstance.users.findUnique.mockResolvedValue(null);

			await userControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if password is incorrect", async () => {
			const mockUser = {
				id: "user-id-123",
				email: "john@example.com",
				password: "hashed_password",
			};
			mockReq.body = {
				email: "john@example.com",
				password: "wrong_password",
			};
			prismaInstance.users.findUnique.mockResolvedValue(mockUser);
			bcrypt.compare.mockResolvedValue(false);

			await userControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully login user", async () => {
			const mockUser = {
				id: "user-id-123",
				email: "john@example.com",
				password: "hashed_password",
				username: "john",
			};
			mockReq.body = {
				email: "john@example.com",
				password: "password123",
			};
			prismaInstance.users.findUnique.mockResolvedValue(mockUser);
			bcrypt.compare.mockResolvedValue(true);

			await userControllers.Login(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalled();
			expect(mockRes.cookie).toHaveBeenCalled();
		});
	});

	describe("MyProfile", () => {
		it("should return user profile", async () => {
			const mockUser = {
				id: "user-id-123",
				username: "john",
				email: "john@example.com",
				full_name: "John Doe",
			};
			prismaInstance.users.findUnique.mockResolvedValue(mockUser);

			await userControllers.MyProfile(mockReq, mockRes, mockNext);

			expect(prismaInstance.users.findUnique).toHaveBeenCalledWith({
				where: { id: "user-id-123" },
			});
		});

		it("should return 404 if user not found", async () => {
			prismaInstance.users.findUnique.mockResolvedValue(null);

			await userControllers.MyProfile(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(404);
		});
	});

	describe("EditProfileData", () => {
		it("should return 400 if request body is missing", async () => {
			mockReq.body = null;

			await userControllers.EditProfileData(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully update user profile", async () => {
			const mockUser = {
				id: "user-id-123",
				full_name: "Jane Doe",
				phone_number: "08123456789",
			};
			mockReq.body = {
				full_name: "Jane Doe",
				phone_number: "08123456789",
			};
			prismaInstance.users.update.mockResolvedValue(mockUser);

			await userControllers.EditProfileData(mockReq, mockRes, mockNext);

			expect(prismaInstance.users.update).toHaveBeenCalled();
		});
	});

	describe("EditAvatar", () => {
		it("should return 400 if no file is uploaded", async () => {
			mockReq.file = null;

			await userControllers.EditAvatar(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully update user avatar", async () => {
			const mockUser = {
				id: "user-id-123",
				avatar_url: "http://cloudinary.com/image.jpg",
			};
			mockReq.file = {
				path: "temp/image.jpg",
			};
			prismaInstance.users.update.mockResolvedValue(mockUser);

			await userControllers.EditAvatar(mockReq, mockRes, mockNext);

			expect(prismaInstance.users.update).toHaveBeenCalled();
		});
	});

	describe("ChangePassword", () => {
		it("should return 400 if password is missing", async () => {
			mockReq.body = { currentPassword: "old123" };

			await userControllers.ChangePassword(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should return 400 if current password is incorrect", async () => {
			const mockUser = {
				id: "user-id-123",
				password: "hashed_old_password",
			};
			mockReq.body = {
				currentPassword: "wrong_password",
				newPassword: "new_password123",
			};
			prismaInstance.users.findUnique.mockResolvedValue(mockUser);
			bcrypt.compare.mockResolvedValue(false);

			await userControllers.ChangePassword(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(400);
		});

		it("should successfully change password", async () => {
			const mockUser = {
				id: "user-id-123",
				password: "hashed_old_password",
			};
			mockReq.body = {
				currentPassword: "old_password",
				newPassword: "new_password123",
			};
			prismaInstance.users.findUnique.mockResolvedValue(mockUser);
			bcrypt.compare.mockResolvedValue(true);
			bcrypt.hash.mockResolvedValue("hashed_new_password");
			prismaInstance.users.update.mockResolvedValue({
				...mockUser,
				password: "hashed_new_password",
			});

			await userControllers.ChangePassword(mockReq, mockRes, mockNext);

			expect(prismaInstance.users.update).toHaveBeenCalled();
		});
	});

	describe("DeleteMyAccount", () => {
		it("should successfully delete user account", async () => {
			prismaInstance.users.delete.mockResolvedValue({ id: "user-id-123" });

			await userControllers.DeleteMyAccount(mockReq, mockRes, mockNext);

			expect(prismaInstance.users.delete).toHaveBeenCalledWith({
				where: { id: "user-id-123" },
			});
		});
	});

	describe("Logout", () => {
		it("should successfully logout user", async () => {
			await userControllers.Logout(mockReq, mockRes, mockNext);

			expect(mockRes.clearCookie).toHaveBeenCalled();
		});
	});
});
