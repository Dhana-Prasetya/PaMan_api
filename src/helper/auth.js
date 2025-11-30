const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
	const verify0pts = {
		// Standard syntax from jwt dependency
		expiresIn: "1h",
		issuer: "PaMan_api",
	};

	const token = jwt.sign(payload, process.env.SECRET_KEY_JWT, verify0pts); // Token params are: payload, secret key, veryfyOpts
	return token;
};

module.exports = { generateToken };
