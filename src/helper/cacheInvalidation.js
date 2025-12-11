const redisClient = require("./redisClient.js");

/**
 * Invalidate all product pagination cache entries
 * Call this after INSERT, UPDATE, or DELETE operations on products
 */
const invalidateProductPaginationCache = async () => {
	try {
		// Get all keys matching the pattern "products:pagination:*"
		const keys = await redisClient.keys("products:pagination:*");

		if (keys.length > 0) {
			// Delete all matching keys
			await redisClient.del(keys);
			console.log(`[Cache Invalidated] Deleted ${keys.length} cache entries`);
		}
	} catch (error) {
		console.error("[Cache Invalidation Error]", error);
	}
};

module.exports = { invalidateProductPaginationCache };
