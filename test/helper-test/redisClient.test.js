const redis = require("redis");

jest.mock("redis");

describe("Redis Client", () => {
	let mockRedisClient;

	beforeEach(() => {
		jest.clearAllMocks();

		// Create mock redis client
		mockRedisClient = {
			connect: jest.fn().mockResolvedValue(undefined),
			on: jest.fn(),
			get: jest.fn(),
			set: jest.fn(),
			del: jest.fn(),
			keys: jest.fn(),
		};

		redis.createClient.mockReturnValue(mockRedisClient);
	});

	it("should create a redis client with correct configuration", () => {
		require("../../src/helper/redisClient");

		expect(redis.createClient).toHaveBeenCalledWith({
			host: process.env.REDIS_URL,
			port: 6379,
			legacyMode: false,
		});
	});

	it("should connect to redis on module load", async () => {
		require("../../src/helper/redisClient");

		expect(mockRedisClient.connect).toHaveBeenCalled();
	});

	it("should set up error handler", async () => {
		require("../../src/helper/redisClient");

		expect(mockRedisClient.on).toHaveBeenCalledWith(
			"error",
			expect.any(Function),
		);
	});

	it("should handle connection errors gracefully", async () => {
		const connectionError = new Error("Connection failed");
		mockRedisClient.connect = jest.fn().mockRejectedValue(connectionError);

		// Suppress console error for testing
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		require("../../src/helper/redisClient");

		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it("should handle runtime redis errors", async () => {
		require("../../src/helper/redisClient");

		const errorHandler = mockRedisClient.on.mock.calls.find(
			(call) => call[0] === "error",
		)[1];

		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		const runtimeError = new Error("Redis runtime error");
		errorHandler(runtimeError);

		expect(consoleErrorSpy).toHaveBeenCalledWith("Redis error:", runtimeError);

		consoleErrorSpy.mockRestore();
	});
});
