class UserAlreadyExistsError extends Error {
	// Custom error class for user registration conflicts
	constructor() {
		super("A user with this email already exists.");
		this.name = "UserAlreadyExistsError";
	}
}

module.exports = UserAlreadyExistsError;
