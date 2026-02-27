const { standarizedResponse } = require("../helper/standarizedResponse.js");

const UserController = ({ registerUseCase } = {}) => ({
	Register: async (httpRequest) => {
		const logger = httpRequest?.context?.logger;

		try {
			if (!registerUseCase) {
				logger?.error?.("Missing register use case dependency");
				throw new Error("MISSING_DEPENDENCIES");
			}

			const result = await registerUseCase(httpRequest.body);

			return standarizedResponse(
				result.toPublicProfile(),
				201,
				"Register success !",
			);
		} catch (error) {
			if (error.name === "UserAlreadyExistsError") {
				logger?.warn?.({ err: error }, "Register conflict: user exists");
				return standarizedResponse(
					null,
					409,
					"Email or username already exists",
				);
			} else {
				logger?.error?.({ err: error }, "Register request failed");
				return standarizedResponse(null, 500, "Internal server error");
			}
		}
	},
});

module.exports = UserController;
