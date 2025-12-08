const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { ADMIN_CONSTRAINT } = require("../config/inputConstraint");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const adminAuth = async (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization) {
			token = req.headers.authorization.split(" ")[1];
			let decoded = jwt.verify(token, process.env.SECRET_KEY_JWT);

			if (decoded.role !== ADMIN_CONSTRAINT.ADMIN_ROLE) {
				return next(new createError(401, "Not Authorized !"));
			}

			// Fetch the temp_token from DB and compare it to the provided token
			const adminTokenInDb = await prisma.admin.findUnique({
				where: { id: decoded.id },
				select: { temp_token: true },
				relationLoadStrategy: "join",
			});

			if (!adminTokenInDb) {
				return next(new createError(401, "Invalid token"));
			}

			if (token !== adminTokenInDb.temp_token) {
				return next(
					new createError(401, "Token has been revoked. Please login again.")
				);
			}

			// Provide a `req.admin` for handlers that expect it
			req.admin = decoded;

			return next();
		} else {
			return res.status(400).json({
				message: "Server need token",
			});
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

module.exports = adminAuth;
