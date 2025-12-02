const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function userDuplicationCheck(
	email = null,
	username = null,
	phone_number = null
) {
	const errors = {}; // Object to hold every client errors

	if (email) {
		let dataInDb = await prisma.users.findUnique({
			// Prisma query to find existing email
			where: {
				email: email,
			},
		});

		if (dataInDb) {
			// Check if email already exists in database
			errors.emailRegistered;
		}
	}

	if (username) {
		let dataInDb = await prisma.users.findUnique({
			// Prisma query to find existing email
			where: {
				username: username,
			},
		});

		if (dataInDb) {
			// Check if email already exists in database
			errors.usernameRegistered;
		}
	}

	if (phone_number) {
		let dataInDb = await prisma.users.findUnique({
			// Prisma query to find existing email
			where: {
				phone_number: phone_number,
			},
		});

		if (dataInDb) {
			// Check if email already exists in database
			errors.phoneNumberRegistered;
		}
	}

	return Object.keys(errors).length;
}

module.exports = userDuplicationCheck;
