const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { USER_CONSTRAINT } = require("../config/inputConstraint");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const userAuth = async (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization) {
			token = req.headers.authorization.split(" ")[1];
			const decoded = jwt.verify(token, process.env.SECRET_KEY_JWT);

			if (decoded.role !== USER_CONSTRAINT.USER_ROLE) {
				return next(new createError(401, "Not Authorized !"));
			}

			// Fetch the temp_token from DB and compare it to the provided token
			const userTokenInDb = await prisma.users.findUnique({
				where: { id: decoded.id },
				select: { temp_token: true },
			});

			if (!userTokenInDb) {
				return next(new createError(401, "Invalid token"));
			}

			if (token !== userTokenInDb.temp_token) {
				return next(
					new createError(401, "Token has been revoked. Please login again.")
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
			next(new createError(400, "Token invalid"));
		} else if (error && error.name === "TokenExpiredError") {
			next(new createError(400, "Token expired"));
		} else {
			next(new createError(500, "Token not active"));
		}
	}
};

module.exports = userAuth;
