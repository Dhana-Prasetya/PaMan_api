const jwt = require("jsonwebtoken");

const GenerateJWTToken = (payload) => {
	const verify0pts = {
		// Standard syntax from jwt dependency
		expiresIn: "15m",
		issuer: "PaMan_api",
	};

	const token = jwt.sign(payload, process.env.SECRET_KEY_JWT, verify0pts); // Token params are: payload, secret key, veryfyOpts
	return token;
};

module.exports = { GenerateJWTToken };
