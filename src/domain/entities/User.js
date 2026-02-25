class User {
	constructor({
		id,
		full_name,
		email,
		password,
		phone_number,
		gender,
		username,
		role,
		avatar_url,
	}) {
		this.id = id;
		this.full_name = full_name;
		this.email = email.toLowerCase();
		this.password = password;
		this.phone_number = phone_number;
		this.gender = gender;
		this.username = username;
		this.role = role || "user";
		this.avatar_url = process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL;
	}

	// Method to remove sensitive data for the UI
	toPublicProfile() {
		return {
			full_name: this.full_name,
			username: this.username,
			email: this.email,
			role: this.role,
		};
	}
}

module.exports = User;
