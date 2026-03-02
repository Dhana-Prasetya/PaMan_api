const globalResponseLogger = require("../helper/globalResponseLogger");

const buildUserCookieAuth = ({ sessionValidationUseCase } = {}) => {
	return async (req, res, next) => {
		const userToken = req.cookies.accessToken;
		const allowedRole = "user";

		if (!userToken) {
			const error = new Error("Authentication Failed");
			error.name = "MissingTokenError";
			const { publicResponse } = globalResponseLogger(req, error);

			return res.status(publicResponse.statusCode).json(publicResponse.body);
		}

		const isValidSession = await sessionValidationUseCase(
			userToken,
			allowedRole,
		);

		if (!isValidSession) {
			const error = new Error("Authentication Failed");
			error.name = "InvalidSessionError";
			const { publicResponse } = globalResponseLogger(req, error);

			return res.status(publicResponse.statusCode).json(publicResponse.body);
		}

		return next();
	};
};

module.exports = buildUserCookieAuth;
