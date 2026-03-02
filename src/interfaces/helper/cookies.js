//interfaces/helper/cookies.js

const cookies = ({ accessToken, jti, prod_stage }) => {
	const secureStatus = false;

	if (prod_stage === true) {
		secureStatus = true;
	}

	return [
		{
			name: "accessToken",
			value: accessToken,
			options: {
				httpOnly: true,
				secure: secureStatus,
				sameSite: "strict",
				maxAge: 15 * 60 * 1000,
			},
		},
		{
			name: "refreshToken",
			value: jti,
			options: {
				httpOnly: true,
				secure: secureStatus,
				sameSite: "strict",
				maxAge: 60 * 60 * 1000 * 24 * 7,
			},
		},
	];
};

module.exports = { cookies };
