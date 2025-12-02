const { generateToken } = require("../helper/auth.js");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const { PrismaClient } = require("@prisma/client");
const { cloudinary } = require("../middleware/cloudinary.js");
const { USER_CONSTRAINT } = require("../config/inputConstraint.js");
const userDuplicationCheck = require("../helper/userDuplicationCheck.js");
const inputCheck = require("../helper/inputCheck.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");
const zodValidator = require("zod");

const saltRounds = 10; // Standard salt rounds for bcrypt
const prisma = new PrismaClient();

const userController = {
	Register: async (req, res) => {
		try {
			let { username, phone_number, email, password, gender } = req.body;

			// ------------------------ Input & Duplication Validations ----------------------- //

			let errors = {}; // Object to hold every client errors

			if (!username || !password || !email || !phone_number || !gender) {
				// Check for empty fields
				return res.status(400).json({ message: "All fields are required !" });
			}

			errors = await inputCheck({
				username,
				email,
				password,
				phone_number,
				gender,
			});

			console.log(errors);

			const duplicationCheck = await userDuplicationCheck(
				email,
				username,
				phone_number
			);

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			if (duplicationCheck > 0) {
				return res.status(400).json({
					message: "Email, username, or phone number is already registered !",
				});
			}

			// ------------------------ Input & Duplication Validations ----------------------- //

			const salt = await bcrypt.genSalt(saltRounds);
			const hashedPassword = await bcrypt.hash(password, salt);

			let data = {
				username,
				password: hashedPassword,
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

			let errors = {}; // Object to hold every client errors

			errors = await inputCheck({
				email,
				password,
			});

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
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

	MyProfile: async (req, res, next) => {
		try {
			const myProfile = await prisma.users.findUnique({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				select: {
					username: true,
					email: true,
					phone_number: true,
					birthday: true,
					gender: true,
				},
			});

			return commonHelper.response(
				res,
				myProfile,
				200,
				"Get my profile success !"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	EditProfileData: async (req, res, next) => {
		try {
			let { username, phone_number, email, birthday = null, gender } = req.body;

			// ------------------------ Input Validations ----------------------- //

			let errors = {}; // Object to hold every client errors

			if (!username || !email || !phone_number || !gender) {
				return res
					.status(400)
					.json({ message: "All fields are required except 'birthday' !" });
			}

			errors = await inputCheck({
				username,
				email,
				phone_number,
				gender,
				birthday,
			});

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			const duplicationCheck = await userDuplicationCheck(
				email,
				username,
				phone_number
			);

			if (duplicationCheck > 0) {
				return res.status(400).json({
					message: "Email, username, or phone number is already registered !",
				});
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
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				data: data,
			});

			return commonHelper.response(res, result, 201, "Edit profile success !");
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	EditAvatar: async (req, res, next) => {
		try {
			if (req.file === undefined) {
				return commonHelper.response(
					res,
					null,
					400,
					"Avatar file is required !"
				);
			}

			const avatarInDb = await prisma.users.findUnique({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				select: {
					avatar_url: true,
				},
			});

			let photo_url;

			if (avatarInDb.avatar_url === USER_CONSTRAINT.DEFAULT_USER_AVATAR_URL) {
				// If user still has default avatar, upload new avatar
				let customPublicId = `${USER_CONSTRAINT.FILE_NAME_PREFIX}${req.user.id}`;

				const updatingDefaultAvatar = await cloudinary.uploader.upload(
					req.file.path,
					{
						public_id: customPublicId,
						folder: USER_CONSTRAINT.DEFAULT_IMAGE_FOLDER,
					}
				);

				photo_url = updatingDefaultAvatar.secure_url; // Get the updated image URL
			} else {
				const cloudinaryPublicId = getCloudinaryPublicId(avatarInDb.avatar_url); // Extract public ID from existing custom avatar URL

				const updatingCustomAvatar = await cloudinary.uploader.upload(
					req.file.path,
					{
						public_id: cloudinaryPublicId, // Same public ID to overwrite existing image
						overwrite: true,
					}
				);

				photo_url = updatingCustomAvatar.secure_url; // Get the updated image URL
			}

			const result = await prisma.users.update({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				data: {
					avatar_url: photo_url,
				},
			});

			return commonHelper.response(res, result, 201, "Edit avatar success !");
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	ChangePassword: async (req, res, next) => {
		try {
			let { old_password, new_password, new_password_confirmation } = req.body;

			// ------------------------ Input Validations ----------------------- //

			if (!old_password || !new_password || !new_password_confirmation) {
				return res.status(400).json({ message: "All fields are required !" });
			}

			let errors = {}; // Object to hold every client errors

			const passwordCheck = zodValidator.string().min(8);

			if (
				!passwordCheck.safeParse(old_password).success ||
				!passwordCheck.safeParse(new_password).success ||
				!passwordCheck.safeParse(new_password_confirmation).success
			) {
				errors.password =
					"Every password need to be at least 8 characters long !";
			}

			// ------------------------ Input Validations ----------------------- //

			const passwordInDb = await prisma.users.findUnique({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				select: { password: true },
			});

			const oldPasswordValidation = await bcrypt.compare(
				old_password,
				passwordInDb.password
			);

			if (!oldPasswordValidation) {
				// Validating old password
				return commonHelper.response(
					res,
					null,
					401,
					"The old password incorrect !"
				);
			}

			if (new_password !== new_password_confirmation) {
				// Validating new password confirmation
				return commonHelper.response(
					res,
					null,
					401,
					"The new password are mismatch !"
				);
			}

			const salt = await bcrypt.genSalt(saltRounds);
			const hashedPassword = await bcrypt.hash(new_password, salt);

			const result = await prisma.users.update({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				data: {
					password: hashedPassword,
				},
			});

			old_password = null; // Clear sensitive data
			new_password = null;
			new_password_confirmation = null;

			return commonHelper.response(
				res,
				result,
				201,
				"Change password success !"
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},
};

module.exports = userController;
