class User {
	constructor({
		full_name,
		email,
		password,
		phone_number,
		gender,
		username,
		role,
		avatar_url,
	}) {
		this.full_name = full_name;
		this.email = email.toLowerCase();
		this.password = password;
		this.phone_number = phone_number;
		this.gender = gender;
		this.username = username;
		this.role = role || "user";
		this.avatar_url = avatar_url || "default.png";
	}

	// Method to remove sensitive data for the UI
	toPublicProfile() {
		return {
			full_name: this.full_name,
			username: this.username,
			email: this.email,
		};
	}
}

module.exports = User;
