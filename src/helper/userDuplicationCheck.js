const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function userDuplicationCheck(email, username, phone_number) {
	const errors = {}; // Object to hold every client errors

	let dataInDb = await prisma.users.findUnique({
		// Prisma query to find existing email
		where: {
			email: email,
		},
	});

	if (dataInDb) {
		// Check if email already exists in database
		errors.emailRegistered = "Email is already registered !";
	}

	dataInDb = await prisma.users.findUnique({
		// Prisma query to find existing email
		where: {
			username: username,
		},
	});

	if (dataInDb) {
		// Check if email already exists in database
		errors.usernameRegistered = "Username is already registered !";
	}

	dataInDb = await prisma.users.findUnique({
		// Prisma query to find existing email
		where: {
			phone_number: phone_number,
		},
	});

	if (dataInDb) {
		// Check if email already exists in database
		errors.phoneNumberRegistered = "Phone number is already registered !";
	}

	return Object.keys(errors).length;
}

module.exports = userDuplicationCheck;
