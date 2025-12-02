const { generateToken } = require("../helper/auth");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const zodValidator = require("zod");
const { PrismaClient } = require("@prisma/client");
const { STRING_CONSTRAINT } = require("../config/inputConstraint.js");

const prisma = new PrismaClient();

const adminController = {
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
				// Make payload for JWT
				email: dataInDb.email,
				role: dataInDb.role,
			};

			dataInDb.token = generateToken(payload); // Create token and add to dataInDb object
			return commonHelper.response(res, dataInDb, 201, "Login success");
		} catch (error) {
			res.send(error);
		}
	},
};

module.exports = adminController;
