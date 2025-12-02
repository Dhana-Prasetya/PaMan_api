const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { ADMIN_CONSTRAINT } = require("../config/inputConstraint");

const adminAuth = (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization) {
			token = req.headers.authorization.split(" ")[1];
			let decoded = jwt.verify(token, process.env.SECRET_KEY_JWT);

			if (decoded.role !== ADMIN_CONSTRAINT.ADMIN_ROLE) {
				next(new createError(401, "Not Authorized !"));
			}

			// Provide a `req.user` alias for handlers that expect it
			req.user = decoded;

			next();
		} else {
			res.json({
				message: "Server need token",
			});
		}
	} catch (error) {
		console.log(error);

		if (error && error.name === "JsonWebTokenError") {
			next(new createError(400, "Token invalid"));
		} else if (error && error.name === "TokenExpiredError") {
			next(new createError(400, "Token expired"));
		} else {
			next(new createError(500, "Token not active"));
		}
	}
};

module.exports = adminAuth;
