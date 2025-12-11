const redis = require("redis");

// Create and export a Redis client for caching
const redisClient = redis.createClient({
	host: "localhost",
	port: 6379,
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
