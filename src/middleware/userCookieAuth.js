const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { USER_CONSTRAINT } = require("../config/inputConstraint");
const redisClient = require("../helper/redisClient");

const userCookieAuth = async (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization) {
			token = req.headers.authorization.split(" ")[1]; // Extract the token from the "Bearer <token>" format

			req.token = token; // Extract the token for ttl calculation

			const decoded = jwt.verify(token, process.env.SECRET_KEY_JWT);

			if (decoded.role !== USER_CONSTRAINT.USER_ROLE) {
				return next(new createError(401, "Not Authorized !"));
			}

			const blacklistJti = `revoked:${decoded.jti}`; // Unique cache key using jti

			const cachedToken = await redisClient.get(blacklistJti); // Check if token is in blacklist

			if (cachedToken) {
				// If token is found in blacklist, deny access
				return next(
					new createError(401, "Session has been revoked. Please login again.")
				);
			}

			// Provide a `req.user` alias for handlers that expect it
			req.user = decoded;

			return next();
		} else {
			return res.status(400).json({ message: "Server need token" });
		}
	} catch (error) {
		console.log(error);

		if (error && error.name === "JsonWebTokenError") {
			return next(new createError(400, "Token invalid"));
		} else if (error && error.name === "TokenExpiredError") {
			return next(new createError(400, "Token expired"));
		} else {
			return next(new createError(500, "Token not active"));
		}
	}
};

module.exports = userCookieAuth;
