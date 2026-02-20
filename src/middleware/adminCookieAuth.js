const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const {ADMIN_CONSTRAINT } = require("../config/inputConstraint");
const redisClient = require("../helper/redisClient");

const adminCookieAuth = async (req, res, next) => {
	try {
		let accessToken;
		if (req.cookies.accessToken) {

			if(!req.cookies.accessToken) { // If access token cookie is missing or expired, deny access
				return next(new createError(401, "Token not found."));
			}

			accessToken = req.cookies.accessToken; // Extract the access token from the cookies

			const decoded = jwt.verify(accessToken, process.env.SECRET_KEY_JWT); // Verify the token and decode its payload

			if (decoded.role !== ADMIN_CONSTRAINT.ADMIN_ROLE) {
				return next(new createError(401, "Not Authorized !"));
			}

			const blacklistAccessToken = `at:revoked-${decoded.jti}`; // Unique cache key using jti

			const cachedToken = await redisClient.get(blacklistAccessToken); // Check if token is in blacklist

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

module.exports = adminCookieAuth;
