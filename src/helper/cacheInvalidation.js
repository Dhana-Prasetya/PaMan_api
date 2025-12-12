const redisClient = require("./redisClient.js");

// Invalidate all product pagination cache entries
const invalidateProductPaginationCache = async () => {
	try {
		// Get all keys matching the pattern "products:pagination:*"
		const productPaginationKeys = await redisClient.keys("page:limit:*"); // Not recommended for large scale project
		const productDetailKeys = await redisClient.keys("id:page:limit:*");

		if (productPaginationKeys.length > 0) {
			// Delete all matching keys
			await redisClient.del(productPaginationKeys);
		}
		if (productDetailKeys.length > 0) {
			// Delete all matching keys
			await redisClient.del(productDetailKeys);
		}
	} catch (error) {
		console.error("[Cache Invalidation Error]", error);
	}
};

module.exports = { invalidateProductPaginationCache };
