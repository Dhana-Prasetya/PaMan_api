const bcrypt = require("bcryptjs");
class PasswordService {
	async hash(password) {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	}

	async compare(password, hashed) {
		return await bcrypt.compare(password, hashed);
	}
}

module.exports = PasswordService;
