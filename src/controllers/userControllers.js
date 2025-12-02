const { generateToken } = require("../helper/auth.js");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const zodValidator = require("zod");
const { PrismaClient } = require("@prisma/client");
const {
	USER_CONSTRAINT,
	STRING_CONSTRAINT,
	DATE_CONSTRAINT,
} = require("../config/inputConstraint.js");
const userDuplicationCheck = require("../helper/userDuplicationCheck.js");

const saltRounds = 10; // Standard salt rounds for bcrypt
const prisma = new PrismaClient();

const userController = {
	Register: async (req, res) => {
		try {
			let { username, phone_number, email, password, gender } = req.body;

			// ------------------------ Input & Duplication Validations ----------------------- //

			const errors = {}; // Object to hold every client errors

			if (!username || !password || !email || !phone_number || !gender) {
				// Check for empty fields
				errors.field = "All fields are required !";
			}

			const emailCheck = zodValidator.string().email(); // Email input validator
			if (!emailCheck.safeParse(email).success) {
				errors.email = "Invalid email format !";
			}

			const passwordCheck = zodValidator.string().min(8);

			if (!passwordCheck.safeParse(password).success) {
				errors.password = "Password need to be at least 8 characters long !";
			}

			if (!USER_CONSTRAINT.GENDER_ENUM.includes(gender)) {
				errors.gender =
					"Gender only support ''Laki'', ''Perempuan'', or ''Rahasia''";
			}

			if (
				// Input length validator
				username.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				password.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				email.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				phone_number.length > USER_CONSTRAINT.PHONE_NUMBER_MAX_VARCHAR
			) {
				errors.length = "Input exceeding maximum characters !";
			}

			const duplicationCheck = await userDuplicationCheck(
				email,
				username,
				phone_number
			);

			if (duplicationCheck > 0) {
				errors.duplication =
					"Email, username, or phone number is already registered !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input & Duplication Validations ----------------------- //

			const salt = await bcrypt.genSalt(saltRounds);
			const hashPassword = await bcrypt.hash(password, salt);

			let data = {
				username,
				password: hashPassword,
				phone_number,
				gender,
				email: email.toLowerCase(), // Normalize email to lowercase
				role: USER_CONSTRAINT.USER_ROLE, // 'user' as a role
				avatar_url: USER_CONSTRAINT.DEFAULT_USER_AVATAR_URL, // Default avatar URL
			};

			const insertIntoDB = await prisma.users.create({
				// Insert new user using prisma
				data: data,
			});

			(delete data.password,
				data.phone_number,
				delete data.avatar_url,
				delete data.gender); // Delete sensitive info from response

			return commonHelper.response(res, data, 201, "Register success !");
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

			const emailCheck = zodValidator.string().email(); // Email input validator
			if (!emailCheck.safeParse(email).success) {
				return res.status(400).json({ message: "Email are not valid !" });
			}

			if (
				// Input length validator
				email.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				password.length > STRING_CONSTRAINT.MAX_VARCHAR
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
				select: {
					id: true,
					email: true,
					password: true,
					role: true,
					avatar_url: true,
					username: true,
				},
			});

			if (!dataInDb) {
				// Validating email
				return commonHelper.response(
					res,
					null,
					401,
					"Email are not registered !"
				);
			}

			const isValidate = await bcrypt.compare(password, dataInDb.password); // Comparing body password with password from 'findEmail'
			if (!isValidate) {
				// Validating password and email
				return commonHelper.response(
					res,
					null,
					401,
					"Invalid password or email !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			delete dataInDb.password; // Delete user password for confidentiality
			delete req.body.password;

			const payload = {
				// Make payload for JWT; include user id so middleware/controllers can authorize
				id: dataInDb.id,
				email: dataInDb.email,
				role: dataInDb.role,
			};

			dataInDb.token = generateToken(payload); // Create token and add to dataInDb object
			return commonHelper.response(res, dataInDb, 201, "Login success");
		} catch (error) {
			res.send(error);
		}
	},

	EditProfileData: async (req, res, next) => {
		try {
			let { username, phone_number, email, birthday = null, gender } = req.body;

			// ------------------------ Input Validations ----------------------- //

			const errors = {}; // Object to hold every client errors

			if (!username || !email || !phone_number || !gender) {
				// Check for empty fields
				errors.field = "All fields are required except 'birthday'!";
			}

			const emailCheck = zodValidator.string().email(); // Email input validator
			if (!emailCheck.safeParse(email).success) {
				errors.email = "Invalid email format !";
			}

			if (!USER_CONSTRAINT.GENDER_ENUM.includes(gender)) {
				errors.gender =
					"Gender only support ''Laki'', ''Perempuan'', or ''Rahasia''";
			}

			if (
				// Input length validator
				username.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				email.length > STRING_CONSTRAINT.MAX_VARCHAR ||
				phone_number.length > USER_CONSTRAINT.PHONE_NUMBER_MAX_VARCHAR
			) {
				errors.length = "Input exceeding maximum characters !";
			}

			const duplicationCheck = await userDuplicationCheck(
				email,
				username,
				phone_number
			);

			if (duplicationCheck > 0) {
				errors.duplication =
					"Failed to update profile: Email, username, or phone number is already exist !";
			}

			if (birthday) {
				if (
					new Date(birthday) < DATE_CONSTRAINT.MIN_DATE ||
					new Date(birthday) > DATE_CONSTRAINT.MAX_DATE
				) {
					errors.birthday = "Birthday date is out of valid range !";
				}
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const data = {
				username,
				phone_number,
				gender,
				email: email.toLowerCase(), // Normalize email to lowercase
				birthday,
			};

			const result = await prisma.users.update({
				where: {
					id: req.user.id,
				},
				data: data,
			});

			return commonHelper.response(res, result, 201, "Edit profile success !");
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	EditAvatar: async (req, res, next) => {},
};

module.exports = userController;
