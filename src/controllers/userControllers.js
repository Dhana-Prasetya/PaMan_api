const { generateToken } = require("../helper/auth");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const inputValidator = require("zod");
const { PrismaClient } = require("@prisma/client");
const limit = require("../config/limit.js");

const prisma = new PrismaClient();

const userController = {
	Register: async (req, res, next) => {
		try {
			let { username, phone_number, email, password, gender } = req.body;

			// ------------------------ Input Validations ----------------------- //

			const errors = {}; // Object to hold every client errors

			if (!username || !password || !email || !phone_number || !gender) {
				// Check for empty fields
				errors.field = "All fields are required !";
			}

			const emailCheck = inputValidator.email(); // Email input validator
			if (!emailCheck.safeParse(email).success) {
				errors.email = "Invalid email format !";
			}

			const passwordCheck = inputValidator.string().min(8);

			if (!passwordCheck.safeParse(password).success) {
				errors.password = "Password need to be at least 8 characters long !";
			}

			if (!limit.genderEnum.includes(gender)) {
				errors.gender =
					"Gender only support ''Laki'', ''Perempuan'', or ''Rahasia''";
			}

			if (
				// Input length validator
				username.length > limit.dbVarcharMax ||
				password.length > limit.dbVarcharMax ||
				email.length > limit.dbVarcharMax ||
				phone_number.length > limit.phoneNumberLimit
			) {
				errors.length = "Input exceeding maximum characters !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			email = email.toLowerCase(); // Normalize email to lowercase

			const dataInDb = await prisma.users.findUnique({
				// Prisma query to find existing email
				where: {
					email: email,
				},
			});

			if (dataInDb) {
				// Check if email already exists in database
				return commonHelper.response(
					res,
					null,
					403,
					"Email is already registered"
				);
			}

			const salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash(password, salt);

			const data = {
				username,
				password: hashPassword,
				phone_number,
				gender,
				email,
			};

			const result = await prisma.users.create({
				// Insert new user using prisma
				data: data,
			});

			return commonHelper.response(res, result, 201, "Register success");
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	Login: async (req, res, next) => {
		try {
			let { email, password } = req.body; // Take email and password from client

			// ------------------------ Input Validations ----------------------- //

			if (!email || !password) {
				return res
					.status(400)
					.json({ message: "Email and password are required !" });
			}

			const emailCheck = inputValidator.email(); // Email input validator
			if (!emailCheck.safeParse(email).success) {
				return res
					.status(400)
					.json({ message: "Email and password are required !" });
			}

			if (
				// Input length validator
				email.length > limit.dbVarcharMax ||
				password.length > limit.dbVarcharMax
			) {
				return res
					.status(400)
					.json({ message: "Email or password are too long !" });
			}

			// ------------------------ Input Validations ----------------------- //

			email = email.toLowerCase();

			const dataInDb = await prisma.users.findUnique({
				where: {
					email: email,
				},
			});

			if (!dataInDb) {
				// Validating email
				return commonHelper.response(
					res,
					null,
					401,
					"Invalid password or email"
				);
			}

			const isValidate = await bcrypt.compare(password, dataInDb.password); // Comparing body password with password from 'findEmail'
			if (!isValidate) {
				// Validating password and email
				return commonHelper.response(
					res,
					null,
					401,
					"Invalid password or email"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			delete dataInDb.password; // Delete user password for confidentiality
			delete req.body.password;

			const payload = {
				// Make payload for JWT
				email: dataInDb.email,
				role: dataInDb.role,
			};

			dataInDb.token = generateToken(payload); // Create token
			return commonHelper.response(res, dataInDb, 201, "Login success");
		} catch (error) {
			res.send(error);
		}
	},
};

module.exports = userController;
