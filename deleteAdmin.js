// scripts/create-admin.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const prisma = new PrismaClient();
const { cloudinary } = require("./src/middleware/cloudinary.js");

const zodValidator = require("zod");
const {
	getCloudinaryPublicId,
} = require("./src/helper/getCloudinaryPublicId.js");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const exitMessage = "\n--- Exiting Admin Deletion Utility ---\n";

async function deleteAdmin() {
	console.log("\n--- Admin Deletion Utility ---\n");

	// Email input

	let emailCredential = await new Promise((resolve) => {
		rl.question("Enter your admin email credential: ", resolve);
	});

	if (!emailCredential) {
		console.error("Email is required !");
		console.log(exitMessage);
		process.exit(1);
	}

	const emailCheck = zodValidator.string().email(); // Email input validator
	if (!emailCheck.safeParse(emailCredential).success) {
		console.error("Invalid email format !");
		console.log(exitMessage);
		process.exit(1);
	}

	emailCredential = emailCredential.toLowerCase();

	let passwordCredential = await new Promise((resolve) => {
		rl.question("Enter your admin password credential: ", resolve);
	});

	const credentialInDb = await prisma.admin.findUnique({
		where: { email: emailCredential },
		select: { password: true },
	});

	if (!credentialInDb) {
		console.error("\nEmail does not exist !");
		console.log(exitMessage);
		process.exit(1);
	}

	const isValidate = await bcrypt.compare(
		passwordCredential,
		credentialInDb.password
	); // Comparing body password with password from 'findEmail'
	if (!isValidate) {
		console.error("\nWrong password !");
		console.log(exitMessage);
		process.exit(1);
	}

	let emailToDelete = await new Promise((resolve) => {
		rl.question("\nEnter admin email to delete: ", resolve);
	});

	if (!emailToDelete) {
		console.error("\nEmail is required !");
		console.log(exitMessage);
		process.exit(1);
	}

	emailToDelete = emailToDelete.toLowerCase();

	const adminToDelete = await prisma.admin.findUnique({
		where: { email: emailToDelete },
		select: { email: true, avatar_url: true },
	});

	if (!adminToDelete) {
		console.error(`\nAdmin with email ${emailToDelete} does not exist !`);
		console.log(exitMessage);
		process.exit(1);
	}

	let deleteConfirmation = await new Promise((resolve) => {
		rl.question(
			`\nAre you sure you want to delete admin with email ${adminToDelete.email} ? This process can not be undone (yes/no): `,
			resolve
		);
	});

	if (deleteConfirmation.toLowerCase() === "yes") {
		const deletedAdmin = await prisma.admin.delete({
			where: { email: emailToDelete },
		});

		const cloudinaryPublicId = getCloudinaryPublicId(adminToDelete.avatar_url); // Extract public ID from URL

		if (cloudinaryPublicId) {
			await cloudinary.uploader.destroy(cloudinaryPublicId);
		}
		console.log(
			`\n✅ Admin with email '${deletedAdmin.email}' has been deleted successfully!`
		);
		console.log(exitMessage);
		process.exit(1);
	} else {
		console.log("\nAdmin deletion cancelled.");
		console.log(exitMessage);
		process.exit(1);
	}
}

deleteAdmin();
