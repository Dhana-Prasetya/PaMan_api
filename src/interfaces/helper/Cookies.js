const Cookies = (res, accessToken, payload) => {
	let stage = process.env.ENV_STAGE;
	let secureStatus = null;

	if (stage === "prod") {
		secureStatus = true;
	} else {
		secureStatus = false;
	}

	res.cookie("accessToken", accessToken, {
		// Access token in HttpOnly cookie
		httpOnly: true, // Prevents JavaScript access (XSS protection)
		secure: secureStatus, // CHANGE TO 'true' IN PRODUCTION (HTTPS) - Ensures cookie is only sent over secure connections
		sameSite: "strict", // Prevents CSRF
		maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
	});

	res.cookie("refreshToken", payload.jti, {
		// Refresh token in HttpOnly cookie
		httpOnly: true, // Prevents JavaScript access (XSS protection)
		secure: secureStatus, // CHANGE TO 'true' IN PRODUCTION (HTTPS) - Ensures cookie is only sent over secure connections
		sameSite: "strict", // Prevents CSRF
		maxAge: 60 * 60 * 1000 * 24 * 7, // 1 week in milliseconds
	});
};

module.exports = { Cookies };
