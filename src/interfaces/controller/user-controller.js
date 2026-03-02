const { cookies } = require("../helper/cookies.js");
const { standarizedResponse } = require("../helper/standarizedResponse.js");

const UserController = ({
	registerUseCase,
	conventionalLoginUseCase,
	logoutUseCase,
} = {}) => ({
	Register: async (httpRequest) => {
		const result = await registerUseCase(httpRequest.body);

		return standarizedResponse(
			result.toPublicProfile(),
			201,
			"Register success !",
		);
	},

	Login: async (httpRequest) => {
		const { accessToken, jti, prod_stage } = await conventionalLoginUseCase(
			httpRequest.body,
		);

		return {
			...standarizedResponse(null, 201, "Login success !"),
			cookies: cookies({ accessToken, jti, prod_stage }),
		};
	},

	Logout: async (httpRequest) => {
		await logoutUseCase(httpRequest.cookies.accessToken);
		return standarizedResponse(null, 201, "Logout success !");
	},
});

module.exports = UserController;
