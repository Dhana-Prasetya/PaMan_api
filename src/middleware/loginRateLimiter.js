const commonHelper = require("../helper/common");
const redisClient = require("../helper/redisClient");

const loginRateLimiter = async (req, res, next) => {
	try {
		const { email } = req.body;
		const key = `login_attempt:${email}`;
		const limit = 5; // Max attempts
		const window = 15 * 60; // 15 minutes in seconds

		const currentAttempts = await redisClient.incr(key);

		if (currentAttempts === 1) {
			// Set expiry only on the first failed attempt
			await redisClient.expire(key, window);
		}

		if (currentAttempts > limit) {
			return commonHelper.response(
				res,
				null,
				429,
				"Too many login attempts. Please try again later.",
			);
		}

		next();
	} catch (error) {
		console.error(error);
		return commonHelper.response(res, null, 500, "Internal server error");
	}
};

module.exports = { loginRateLimiter };
