const redis = require("redis");

// Create and export a Redis client for caching
const redisClient = redis.createClient({
	url: process.env.REDIS_URL,
	legacyMode: false, // Use modern async/await API
});

// Connect to Redis and handle errors
redisClient.connect().catch((err) => {
	console.error("Redis connection failed:", err);
});

redisClient.on("error", (err) => {
	console.error("Redis error:", err);
});

module.exports = redisClient;
