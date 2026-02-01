const getRemainingTokenLifetime = require("../../src/helper/getRemainingTokenLifetime");
const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

describe("Helper - getRemainingTokenLifetime", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		jest.setSystemTime(new Date("2024-01-15T10:00:00Z"));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should return remaining seconds for a valid token", () => {
		const currentTime = Math.floor(Date.now() / 1000); // 1705318800
		const expiryTime = currentTime + 3600; // 1 hour from now

		jwt.decode.mockReturnValue({ exp: expiryTime });

		const result = getRemainingTokenLifetime("valid_token");

		expect(result).toBe(3600);
	});

	it("should return 0 for an expired token", () => {
		const currentTime = Math.floor(Date.now() / 1000);
		const expiryTime = currentTime - 1000; // Expired 1000 seconds ago

		jwt.decode.mockReturnValue({ exp: expiryTime });

		const result = getRemainingTokenLifetime("expired_token");

		expect(result).toBe(0);
	});

	it("should return 0 for a token without exp claim", () => {
		jwt.decode.mockReturnValue({ sub: "user123" }); // No exp field

		const result = getRemainingTokenLifetime("token_without_exp");

		expect(result).toBe(0);
	});

	it("should return 0 for a malformed token", () => {
		jwt.decode.mockImplementation(() => {
			throw new Error("Invalid token");
		});

		const result = getRemainingTokenLifetime("malformed_token");

		expect(result).toBe(0);
	});

	it("should return 0 for null token decode result", () => {
		jwt.decode.mockReturnValue(null);

		const result = getRemainingTokenLifetime("invalid_token");

		expect(result).toBe(0);
	});

	it("should handle token expiring soon", () => {
		const currentTime = Math.floor(Date.now() / 1000);
		const expiryTime = currentTime + 60; // 1 minute from now

		jwt.decode.mockReturnValue({ exp: expiryTime });

		const result = getRemainingTokenLifetime("token_expiring_soon");

		expect(result).toBe(60);
	});

	it("should handle token with large remaining time", () => {
		const currentTime = Math.floor(Date.now() / 1000);
		const expiryTime = currentTime + 86400 * 30; // 30 days from now

		jwt.decode.mockReturnValue({ exp: expiryTime });

		const result = getRemainingTokenLifetime("long_lived_token");

		expect(result).toBe(86400 * 30);
	});

	it("should handle boundary case at exact expiration time", () => {
		const currentTime = Math.floor(Date.now() / 1000);
		const expiryTime = currentTime; // Exactly now

		jwt.decode.mockReturnValue({ exp: expiryTime });

		const result = getRemainingTokenLifetime("token_at_expiration");

		expect(result).toBe(0);
	});

	it("should always return non-negative values", () => {
		const currentTime = Math.floor(Date.now() / 1000);
		const expiryTime = currentTime - 5000; // 5000 seconds in the past

		jwt.decode.mockReturnValue({ exp: expiryTime });

		const result = getRemainingTokenLifetime("very_expired_token");

		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBe(0);
	});

	it("should handle zero expiry timestamp", () => {
		jwt.decode.mockReturnValue({ exp: 0 });

		const result = getRemainingTokenLifetime("zero_expiry_token");

		expect(result).toBe(0);
	});
});
