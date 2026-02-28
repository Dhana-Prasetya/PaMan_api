const { standarizedResponse } = require("./standarizedResponse");

const errorMapper = {
	toResponse: (error) => {
		if (error.name === "UserAlreadyExistsError") {
			return {
				publicResponse: standarizedResponse(
					null,
					409,
					"Email or phone number already registered !",
				),
				logLevel: "warn",
				logMessage: "Register conflict: user exists",
			};
		}

		if (error.name === "IncompleteRegisterDataError") {
			return {
				publicResponse: standarizedResponse(
					null,
					400,
					error.validationErrors || "Incomplete registration data !",
				),
				logLevel: "warn",
				logMessage: "Register conflict: incomplete data",
			};
		}

		if (error.name === "IncompleteLoginDataError") {
			return {
				publicResponse: standarizedResponse(
					null,
					400,
					error.validationErrors || "Incomplete login data !",
				),
				logLevel: "warn",
				logMessage: "Login conflict: incomplete data",
			};
		}

		if (error.name === "UserProfileValidationError") {
			return {
				publicResponse: standarizedResponse(
					null,
					400,
					error.validationErrors || "Invalid registration data !",
				),
				logLevel: "warn",
				logMessage: "Register conflict: invalid data",
			};
		}

		if (error.name === "InvalidCredentialsError") {
			return {
				publicResponse: standarizedResponse(null, 400, "Invalid credentials !"),
				logLevel: "warn",
				logMessage: "Login conflict: invalid credentials",
			};
		}

		return {
			publicResponse: standarizedResponse(null, 500, "Internal server error"),
			logLevel: "error",
			logMessage: "Unhandled internal error",
		};
	},
};

module.exports = errorMapper;
