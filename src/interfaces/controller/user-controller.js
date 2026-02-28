const { standarizedResponse } = require("../helper/standarizedResponse.js");

const UserController = ({ registerUseCase } = {}) => ({
	Register: async (httpRequest) => {
		const result = await registerUseCase(httpRequest.body);

		return standarizedResponse(
			result.toPublicProfile(),
			201,
			"Register success !",
		);
	},

	Login: async (httpRequest) => {
		// const result = await registerUseCase(httpRequest.body);

		return standarizedResponse(
			result.toPublicProfile(),
			201,
			"Login success !",
		);
	},
});

module.exports = UserController;
