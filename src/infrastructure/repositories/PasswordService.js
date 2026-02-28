const bcrypt = require("bcryptjs");
class PasswordService {
	async hash(password) {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	}

	async compare(password, hashedPassword) {
		return await bcrypt.compare(password, hashedPassword);
	}
}

module.exports = PasswordService;
