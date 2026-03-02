const userProfileInputCheck = require("../validation/userProfileInputCheck");

module.exports = async ({
	userRepository,
	passwordService,
	userData,
	jwtToken,
	redisCacheRepository,
	envValue,
}) => {
	userProfileInputCheck(userData); // 1. Validation (throws if invalid)

	const savedUser = await userRepository.findByEmail(userData.email);

	if (!savedUser) {
		const error = new Error("User not found");
		error.name = "UserNotFoundError";
		throw error;
	}

	if (!savedUser.password) {
		const error = new Error("Login method not supported");
		error.name = "NotSupportedLoginMethodError";
		throw error;
	}

	const hashedPassword = await passwordService.compare(
		userData.password,
		savedUser.password,
	);

	if (!hashedPassword) {
		const error = new Error("Invalid credentials");
		error.name = "InvalidCredentialsError";
		throw error;
	}

	const { accessToken, jti } = jwtToken.createToken(
		savedUser,
		envValue.secretKey,
	);

	const redisTTL = 7 * 24 * 60 * 60; // 7 days in seconds

	await redisCacheRepository.save(`rt:${jti}`, savedUser.id, redisTTL); // Store refresh token in Redis with an expiration time

	let prod_stage = false;

	if (envValue.env_stage === "prod") {
		prod_stage = true;
	}

	return { accessToken, jti, prod_stage };
};
