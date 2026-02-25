const { standarizedResponse } = require("../helper/standarizedResponse.js");

const UserController = ({
	registerUseCase,
	userRepository,
	passwordService,
} = {}) => ({
	Register: async (httpRequest) => {
		try {
			if (!registerUseCase || !userRepository || !passwordService) {
				throw new Error("MISSING_DEPENDENCIES");
			}

			const result = await registerUseCase(
				// Call the 'RegisterUser' use case with injected dependencies
				userRepository,
				passwordService,
				httpRequest.body, // user data from request body
			);

			return standarizedResponse(
				result.toPublicProfile(),
				201,
				"Register success !",
			);
		} catch (error) {
			if (error.code === "P2002") {
				return standarizedResponse(
					null,
					409,
					"Email or username already exists",
				);
			} else {
				console.error(`\n${error}\n`);
				return standarizedResponse(null, 500, "Internal server error");
			}
		}
	},
});

module.exports = UserController;
