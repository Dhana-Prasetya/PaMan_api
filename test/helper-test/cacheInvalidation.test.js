const {
	invalidateProductPaginationCache,
} = require("../../src/helper/cacheInvalidation");
const redisClient = require("../../src/helper/redisClient");

jest.mock("../../src/helper/redisClient", () => ({
	keys: jest.fn(),
	del: jest.fn(),
}));

describe("Cache Invalidation Helper", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("invalidateProductPaginationCache", () => {
		it("should delete product pagination cache keys", async () => {
			const mockPaginationKeys = ["page:limit:1", "page:limit:2"];
			redisClient.keys.mockResolvedValueOnce(mockPaginationKeys);
			redisClient.keys.mockResolvedValueOnce([]);
			redisClient.del.mockResolvedValue(2);

			await invalidateProductPaginationCache();

			expect(redisClient.keys).toHaveBeenCalledWith("page:limit:*");
			expect(redisClient.del).toHaveBeenCalledWith(mockPaginationKeys);
		});

		it("should delete product detail cache keys", async () => {
			redisClient.keys.mockResolvedValueOnce([]);
			const mockDetailKeys = [
				"id:page:limit:1",
				"id:page:limit:2",
				"id:page:limit:3",
			];
			redisClient.keys.mockResolvedValueOnce(mockDetailKeys);
			redisClient.del.mockResolvedValue(3);

			await invalidateProductPaginationCache();

			expect(redisClient.keys).toHaveBeenCalledWith("id:page:limit:*");
			expect(redisClient.del).toHaveBeenCalledWith(mockDetailKeys);
		});

		it("should handle empty pagination keys", async () => {
			redisClient.keys.mockResolvedValueOnce([]);
			redisClient.keys.mockResolvedValueOnce([]);

			await invalidateProductPaginationCache();

			expect(redisClient.del).not.toHaveBeenCalled();
		});

		it("should delete all matching keys in both patterns", async () => {
			const mockPaginationKeys = ["page:limit:1", "page:limit:2"];
			const mockDetailKeys = ["id:page:limit:1"];

			redisClient.keys
				.mockResolvedValueOnce(mockPaginationKeys)
				.mockResolvedValueOnce(mockDetailKeys);
			redisClient.del.mockResolvedValue(3);

			await invalidateProductPaginationCache();

			expect(redisClient.del).toHaveBeenCalledTimes(2);
			expect(redisClient.del).toHaveBeenNthCalledWith(1, mockPaginationKeys);
			expect(redisClient.del).toHaveBeenNthCalledWith(2, mockDetailKeys);
		});

		it("should handle redis errors gracefully", async () => {
			const error = new Error("Redis error");
			redisClient.keys.mockRejectedValue(error);

			const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

			await invalidateProductPaginationCache();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[Cache Invalidation Error]",
				error,
			);

			consoleErrorSpy.mockRestore();
		});

		it("should handle error in del operation", async () => {
			const mockKeys = ["page:limit:1"];
			redisClient.keys.mockResolvedValueOnce(mockKeys);
			redisClient.keys.mockResolvedValueOnce([]);

			const error = new Error("Delete failed");
			redisClient.del.mockRejectedValue(error);

			const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

			await invalidateProductPaginationCache();

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[Cache Invalidation Error]",
				error,
			);

			consoleErrorSpy.mockRestore();
		});

		it("should handle large number of cache keys", async () => {
			const largeKeySet = Array.from(
				{ length: 100 },
				(_, i) => `page:limit:${i}`,
			);
			redisClient.keys.mockResolvedValueOnce(largeKeySet);
			redisClient.keys.mockResolvedValueOnce([]);
			redisClient.del.mockResolvedValue(100);

			await invalidateProductPaginationCache();

			expect(redisClient.del).toHaveBeenCalledWith(largeKeySet);
		});

		it("should call keys function with correct patterns", async () => {
			redisClient.keys.mockResolvedValueOnce([]);
			redisClient.keys.mockResolvedValueOnce([]);

			await invalidateProductPaginationCache();

			const firstCall = redisClient.keys.mock.calls[0][0];
			const secondCall = redisClient.keys.mock.calls[1][0];

			expect(firstCall).toBe("page:limit:*");
			expect(secondCall).toBe("id:page:limit:*");
		});

		it("should be an async function", () => {
			expect(invalidateProductPaginationCache()).toBeInstanceOf(Promise);
		});
	});
});
