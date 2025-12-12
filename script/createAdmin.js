// scripts/create-admin.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const {
	ADMIN_CONSTRAINT,
	USER_CONSTRAINT,
	IMAGE_CONSTRAINT,
} = require("../src/config/inputConstraint.js");
const prisma = new PrismaClient();
const { cloudinary } = require("../src/middleware/cloudinary.js");
const path = require("path");
const fs = require("fs");
const fileType = require("file-type");
const zodValidator = require("zod");
const saltRounds = 10; // Standard salt rounds for bcrypt

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const exitMessage = "\n--- Exiting Admin Creation Utility ---\n";

async function createAdmin() {
	console.log("\n--- Admin Creation Utility ---\n");

	// Email input

	let email = await new Promise((resolve) => {
		rl.question("Enter admin email: ", resolve);
	});

	if (!email) {
		console.error("Email is required !");
		console.log(exitMessage);
		process.exit(1);
	}

	const emailCheck = zodValidator.string().email(); // Email input validator
	if (!emailCheck.safeParse(email).success) {
		console.error("Invalid email format !");
		console.log(exitMessage);
		process.exit(1);
	}

	// Username Input
	const username = await new Promise((resolve) => {
		rl.question("Enter admin username: ", resolve);
	});

	if (!username) {
		console.error("Username is required !");
		console.log(exitMessage);
		process.exit(1);
	}

	// Password Input
	const password = await new Promise((resolve) => {
		rl.question("Enter admin password: ", resolve);
	});

	if (!password) {
		console.error("Password is required !");
		console.log(exitMessage);
		process.exit(1);
	}

	// Image Path Input
	const imagePath = await new Promise((resolve) =>
		rl.question("Enter absolute image path (e.g., ./profile.jpg): ", resolve)
	);

	if (!imagePath) {
		console.error("Image path is required !");
		console.log(exitMessage);
		process.exit(1);
	}

	const absolutePath = path.resolve(imagePath);
	if (!fs.existsSync(absolutePath)) {
		console.error(`\n❌ Error: File not found at path: ${absolutePath}`);
		console.log(exitMessage);
		process.exit(1);
	}

	const stats = fs.statSync(absolutePath);
	if (stats.size > IMAGE_CONSTRAINT.MAX_SIZE) {
		console.error(
			`\n❌ Error: File size exceeds the limit of ${IMAGE_CONSTRAINT.MAX_SIZE / (1024 * 1024)}MB.`
		);
		console.log(exitMessage);
		process.exit(1);
	}

	rl.close();

	const type = await fileType.fileTypeFromFile(absolutePath);

	if (!type || !IMAGE_CONSTRAINT.ALLOWED_FORMATS.includes(type.mime)) {
		console.error(
			`\n❌ Error: Invalid file format. Must be JPEG, JPG, PNG, or WebP !`
		);
		console.log(exitMessage);
		process.exit(1);
	}

	email = email.toLowerCase();

	try {
		// 3. Hash the Password
		console.log("\nHashing password...");
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// 4. Check if user already exists
		const existingUser = await prisma.admin.findUnique({ where: { email } });
		if (existingUser) {
			console.error(`Error: User with email ${email} already exists.`);
			console.log(exitMessage);
			process.exit(1);
		}

		const newUser = await prisma.admin.create({
			// Create admin record
			data: {
				username: username,
				email: email,
				password: hashedPassword,
				role: ADMIN_CONSTRAINT.ADMIN_ROLE,
			},
		});

		const adminId = await prisma.admin.findUnique({
			// Fetch admin ID
			where: { email: email },
			select: { id: true },
		});

		const customPublicId = `${ADMIN_CONSTRAINT.FILE_NAME_PREFIX}${adminId.id}`;

		console.log("\nUploading image to Cloudinary...");

		const uploadResult = await cloudinary.uploader.upload(absolutePath, {
			folder: USER_CONSTRAINT.DEFAULT_IMAGE_FOLDER,
			public_id: customPublicId,
		});

		const imageUrl = uploadResult.secure_url;
		console.log(`\n✅ Image uploaded successfully: ${imageUrl}`);

		// 5. Create User Record directly in DB with 'admin' role
		const insertImageUrl = await prisma.admin.update({
			where: { id: adminId.id },
			data: {
				avatar_url: imageUrl,
			},
		});

		console.log("\n✅ Admin user successfully created!");
		console.log(`\nusername: ${newUser.username}, Role: ${newUser.role}`);
	} catch (error) {
		console.error("\n❌ Database error during creation:", error.message);
	} finally {
		// await prisma.$disconnect();
	}
}

createAdmin();
