const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { USER_CONSTRAINT } = require("../config/inputConstraint");

const buildUserCookieAuth = ({ sessionValidationUseCase } = {}) => {
	if (
		!sessionValidationUseCase ||
		typeof sessionValidationUseCase !== "function"
	) {
		throw new Error("MISSING_SESSION_VALIDATION_USE_CASE");
	}

	return async (req, res, next) => {
		try {
			if (!req.cookies.accessToken) {
				return res
					.status(400)
					.json({ message: "Server need active access token" });
			}

			const accessToken = req.cookies.accessToken;
			const decoded = jwt.verify(accessToken, process.env.SECRET_KEY_JWT);

			if (decoded.role !== USER_CONSTRAINT.USER_ROLE) {
				return next(new createError(401, "Not Authorized !"));
			}

			const blacklistAccessToken = `at:revoked-${decoded.jti}`;
			const cachedToken = await redisCacheRepository.get(blacklistAccessToken);

			if (cachedToken) {
				return next(
					new createError(401, "Session has been revoked. Please login again."),
				);
			}

			req.user = decoded;
			return next();
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
};

module.exports = buildUserCookieAuth;
