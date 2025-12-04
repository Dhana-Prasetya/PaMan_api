const userInputCheck = require("../helper/userInputCheck.js");
const { PrismaClient } = require("@prisma/client");
const commonHelper = require("../helper/common.js");

const prisma = new PrismaClient();

const contactController = {
	Contact: async (req, res, next) => {
		try {
			const { username, email, message } = req.body;

			if (!username || !email || !message) {
				return res.status(400).json({ message: "All fields are required !" });
			}

			// ------------------------ Input Validations ----------------------- //

			let errors = {}; // Object to hold every client errors

			errors = await userInputCheck({
				username,
				email,
				message,
			});

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const saveContactMessage = await prisma.contact.create({
				data: {
					username,
					email: email.toLowerCase(),
					message,
				},
			});

			return commonHelper.response(
				res,
				null,
				201,
				"Contact message sent successfully !"
			);
		} catch {
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},
};

module.exports = contactController;
