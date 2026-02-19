const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { USER_CONSTRAINT } = require("../config/inputConstraint");
const redisClient = require("../helper/redisClient");

const userCookieAuth = async (req, res, next) => {
	try {
		let accessToken;
		if (req.cookies.accessToken) {

			if(!req.cookies.accessToken) { // If access token cookie is missing or expired, deny access
				return next(new createError(401, "Token not found."));
			}

			accessToken = req.cookies.accessToken; // Extract the access token from the cookies

			const decoded = jwt.verify(accessToken, process.env.SECRET_KEY_JWT); // Verify the token and decode its payload

			if (decoded.role !== USER_CONSTRAINT.USER_ROLE) {
				return next(new createError(401, "Not Authorized !"));
			}

			const whitelistJti = `rt:${decoded.jti}`; // Unique cache key using jti

			let cachedToken = await redisClient.get(whitelistJti); // Check if token is in whitelist

			if (!cachedToken) {
				// If token is not found in whitelist, deny access
				return next(
					new createError(401, "Session has been revoked. Please login again.")
				);
			}

			const blacklistJti = `revoked:${decoded.jti}`; // Unique cache key using jti

			cachedToken = await redisClient.get(blacklistJti); // Check if token is in blacklist

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
			return res.status(400).json({ message: "Server need active access token" });
		}
	} catch (error) {
		console.log(error);

		if (error && error.name === "JsonWebTokenError") {
			return next(new createError(400, "Access token invalid"));
		} else if (error && error.name === "TokenExpiredError") {
			return next(new createError(401, "Access token expired"));
		} else {
			return next(new createError(500, "Access token not active"));
		}
	}
};

module.exports = userCookieAuth;
