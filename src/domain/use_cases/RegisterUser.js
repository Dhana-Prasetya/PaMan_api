const User = require("../entities/User");

module.exports = async (userRepository, passwordService, userData) => {
	// 1. Business Logic: Check if email exists
	const existingEmail = await userRepository.findByEmail(userData.email);
	if (existingEmail) throw new Error("Email already registered");

	// 2. Logic: Hash password (delegated to a service)
	const hashedPassword = await passwordService.hash(userData.password);

	// 3. Logic: Generate Unique Username
	let finalUsername = await generateUniqueUsername(
		userRepository,
		userData.full_name,
	);

	// 4. Create Entity
	const userEntity = new User({
		...userData,
		password: hashedPassword,
		username: finalUsername,
	});

	// 5. Save via Repository
	const savedUser = await userRepository.save(userEntity);
	return new User(savedUser);
};

// Helper inside use case for username logic
async function generateUniqueUsername(repo, full_name) {
	let username = full_name.trim().split(/\s+/)[0].toLowerCase();
	let isUnique = false;
	let attempt = username;
	while (!isUnique) {
		const num = Math.floor(Math.random() * 100)
			.toString()
			.padStart(2, "0");
		attempt = (username + num).slice(0, 20);
		const exists = await repo.findByUsername(attempt);
		if (!exists) isUnique = true;
	}
	return attempt;
}
