const jwt = require("jsonwebtoken");
const generateUUID = require("../helper/generateUUID");

class JWTToken {
	createToken = (savedUser, secretKey) => {
		const uuid = generateUUID(); // Generate a unique identifier for the token

		const payload = {
			id: savedUser.id,
			email: savedUser.email,
			role: savedUser.role,
			jti: uuid,
		};

		const verify0pts = {
			// Standard syntax from jwt dependency
			expiresIn: "15m",
			issuer: "PaMan_api",
		};

		const accessToken = jwt.sign(payload, secretKey, verify0pts); // Token params are: payload, secret key, veryfyOpts
		return { accessToken, jti: payload.jti }; // Return both the token and its unique identifier (jti)
	};

	decodeToken = (userToken, secretKey) => {
		const decoded = jwt.verify(userToken, secretKey);
		return decoded;
	};
}

module.exports = JWTToken;
