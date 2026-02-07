const { generateToken } = require("../../src/helper/auth");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

describe("Auth Helper - generateToken", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should generate a token with valid payload", () => {
		const mockToken = "mock_jwt_token";
		const payload = { id: "user-123", email: "test@example.com" };

		jwt.sign.mockReturnValue(mockToken);

		const result = generateToken(payload);

		expect(jwt.sign).toHaveBeenCalledWith(
			payload,
			process.env.SECRET_KEY_JWT,
			expect.objectContaining({
				expiresIn: "1h",
				issuer: "PaMan_api",
			}),
		);
		expect(result).toBe(mockToken);
	});

	it("should handle empty payload", () => {
		const mockToken = "mock_jwt_token";
		const payload = {};

		jwt.sign.mockReturnValue(mockToken);

		const result = generateToken(payload);

		expect(jwt.sign).toHaveBeenCalled();
		expect(result).toBe(mockToken);
	});

	it("should include correct token expiration", () => {
		const mockToken = "mock_jwt_token";
		const payload = { id: "user-123" };

		jwt.sign.mockReturnValue(mockToken);

		generateToken(payload);

		const callArgs = jwt.sign.mock.calls[0];
		expect(callArgs[2].expiresIn).toBe("1h");
	});

	it("should include correct issuer in token", () => {
		const mockToken = "mock_jwt_token";
		const payload = { id: "user-123" };

		jwt.sign.mockReturnValue(mockToken);

		generateToken(payload);

		const callArgs = jwt.sign.mock.calls[0];
		expect(callArgs[2].issuer).toBe("PaMan_api");
	});

	it("should use environment secret key", () => {
		const mockToken = "mock_jwt_token";
		const payload = { id: "user-123" };
		const testSecret = "test-secret-key";
		process.env.SECRET_KEY_JWT = testSecret;

		jwt.sign.mockReturnValue(mockToken);

		generateToken(payload);

		const callArgs = jwt.sign.mock.calls[0];
		expect(callArgs[1]).toBe(testSecret);
	});

	it("should handle complex payload objects", () => {
		const mockToken = "mock_jwt_token";
		const payload = {
			id: "user-123",
			email: "test@example.com",
			role: "admin",
			permissions: ["read", "write"],
		};

		jwt.sign.mockReturnValue(mockToken);

		const result = generateToken(payload);

		expect(jwt.sign).toHaveBeenCalledWith(
			payload,
			process.env.SECRET_KEY_JWT,
			expect.any(Object),
		);
		expect(result).toBe(mockToken);
	});
});
