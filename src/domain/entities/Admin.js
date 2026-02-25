class Admin {
	constructor({ id, username, email, password, role, avatar_url }) {
		this.id = id;
		this.username = username;
		this.email = email.toLowerCase();
		this.password = password;
		this.role = role || "admin";
		this.avatar_url = avatar_url;
	}
	// Method to remove sensitive data for the UI
	toPublicProfile() {
		return {
			username: this.username,
			email: this.email,
		};
	}
}

module.exports = Admin;
