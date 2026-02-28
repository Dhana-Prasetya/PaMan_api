const userProfileInputCheck = require("../validation/userProfileInputCheck");

module.exports = async (userRepository, passwordService, userData) => {
	userProfileInputCheck(userData); // 1. Validation (throws if invalid)

	const savedUser = await userRepository.findByEmail(userData.email);

	// 2. Logic: Compare password (delegated to a service)
	const hashedPassword = await passwordService.compare(
		userData.password,
		savedUser.password,
	);

	if (!hashedPassword) {
		const error = new Error("Invalid credentials");
		error.name = "InvalidCredentialsError";
		throw error;
	}
};
