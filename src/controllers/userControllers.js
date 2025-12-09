const { generateToken } = require("../helper/auth.js");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const { PrismaClient, Prisma } = require("@prisma/client");
const { cloudinary } = require("../middleware/cloudinary.js");
const { USER_CONSTRAINT } = require("../config/inputConstraint.js");
const userProfileInputCheck = require("../helper/userProfileInputCheck.js");
const { getCloudinaryPublicId } = require("../helper/getCloudinaryPublicId.js");
const zodValidator = require("zod");
const removeNullProperties = require("../helper/removeNullProperties.js");
const capitalizeFirstLetter = require("../helper/capitalizeFirstLetter.js");
const { is } = require("zod/locales");

const saltRounds = 10; // Standard salt rounds for bcrypt
const prisma = new PrismaClient();

const userController = {
	Register: async (req, res) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}
			let { fullname, phone_number, email, password, gender } = req.body;

			// ------------------------ Input & Validations ----------------------- //

			let errors = {}; // Object to hold every client errors

			if (!fullname || !password || !email || !phone_number || !gender) {
				// Check for empty fields
				return res.status(400).json({ message: "All fields are required !" });
			}

			errors = await userProfileInputCheck({
				fullname,
				email,
				password,
				phone_number,
				gender,
			});

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input & Validations ----------------------- //

			const salt = await bcrypt.genSalt(saltRounds);
			const hashedPassword = await bcrypt.hash(password, salt);

			let username = fullname.trim().split(/\s+/)[0]; // Get first word from fullname as username
			username = username.toLowerCase(); // Normalize username to lowercase
			username = capitalizeFirstLetter(username); // Capitalize first letter of username

			let isUnique = false; // Must be outside the loop
			let finalUsername = username; // To avoid mutating the original input

			do {
				// Loop until a unique username is found
				const num = Math.floor(Math.random() * 100);
				const formatted = String(num).padStart(2, "0");

				// Combine the base username and the random number
				const currentAttempt = (username + formatted).slice(
					0,
					USER_CONSTRAINT.MAX_USERNAME_LENGTH
				);

				const usernameExists = await prisma.users.findUnique({
					where: { username: currentAttempt },
					relationLoadStrategy: "join",
				});

				if (!usernameExists) {
					finalUsername = currentAttempt;
					isUnique = true;
				}
			} while (!isUnique);

			let data = {
				fullname,
				username: finalUsername,
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
				delete data.phone_number,
				delete data.avatar_url,
				delete data.gender); // Delete sensitive info from response

			return commonHelper.response(res, data, 201, "Register success !");
		} catch (error) {
			if (error.code === "P2002") {
				// Prisma unique constraint error code
				return res.status(400).json({
					message: "Email, username, or phone number is already registered !",
				});
			} else {
				console.error(`\n${error}\n`);
				return commonHelper.response(res, null, 500, "Internal server error");
			}
		}
	},

	Login: async (req, res, next) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}
			let { email, password } = req.body; // Take email and password from client

			// ------------------------ Input Validations ----------------------- //

			if (!email || !password) {
				return res
					.status(400)
					.json({ message: "Email and password are required !" });
			}

			let errors = {}; // Object to hold every client errors

			errors = await userProfileInputCheck({
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
				relationLoadStrategy: "join",
			});

			if (!dataInDb) {
				// Validating email
				return commonHelper.response(res, null, 401, "Email not found !");
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

			const updateTempToken = await prisma.users.update({
				// Store temp_token in database for logout purposes
				where: {
					id: dataInDb.id,
				},
				data: {
					temp_token: dataInDb.token,
				},
			});

			return commonHelper.response(res, dataInDb, 201, "Login success");
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
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
					fullname: true,
					email: true,
					phone_number: true,
					birthday: true,
					gender: true,
				},
				relationLoadStrategy: "join",
			});

			if (!myProfile) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !"
				);
			}

			return commonHelper.response(
				res,
				myProfile,
				200,
				"Get my profile success !"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	EditProfileData: async (req, res, next) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}
			let {
				username = null,
				fullname = null,
				phone_number = null,
				email = null,
				birthday = null,
				gender = null,
			} = req.body;

			// ------------------------ Input Validations ----------------------- //

			let errors = {}; // Object to hold every client errors

			if (
				!username &&
				!email &&
				!phone_number &&
				!gender &&
				!birthday &&
				!fullname
			) {
				return res.status(400).json({
					message:
						"Atleast one fields must be provided to update profile data !",
				});
			}

			errors = await userProfileInputCheck({
				username,
				email,
				phone_number,
				gender,
				birthday,
				fullname,
			});

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			if (birthday) {
				// If birthday provided, convert to Date object
				birthday = new Date(birthday);
			}

			let data = {
				username,
				fullname,
				phone_number,
				gender,
				email,
				birthday,
			};

			if (username != null) data.username = username; // If these data provided, add to data object
			if (fullname != null) data.fullname = fullname;
			if (phone_number != null) data.phone_number = phone_number;
			if (gender != null) data.gender = gender;
			if (email != null) data.email = email.toLowerCase();
			if (birthday != null) data.birthday = birthday;

			data = removeNullProperties(data); // Remove null properties from data object

			const editProfileDb = await prisma.$transaction(
				[
					prisma.users.update({
						where: {
							id: req.user.id, // Get user id from userAuth middleware (token)
						},
						data: data,
					}),
				],
				{
					transactionOptions: {
						isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
						setTimeout: 10000,
					},
				}
			);

			return commonHelper.response(
				res,
				editProfileDb,
				201,
				"Edit profile success !"
			);
		} catch (error) {
			if (error.code === "P2002") {
				// Prisma unique constraint error code
				return res.status(400).json({
					message: "Email, username, or phone number is already taken !",
				});
			} else {
				console.error(`\n${error}\n`);
				return commonHelper.response(res, null, 500, "Internal server error");
			}
		}
	},

	EditAvatar: async (req, res, next) => {
		try {
			const myProfile = await prisma.users.findUnique({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				select: { id: true, avatar_url: true },
			});

			if (!myProfile) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !"
				);
			}

			if (req.file === undefined) {
				return commonHelper.response(
					res,
					null,
					400,
					"Avatar file is required !"
				);
			}

			let photo_url;

			if (myProfile.avatar_url === USER_CONSTRAINT.DEFAULT_USER_AVATAR_URL) {
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
				const cloudinaryPublicId = getCloudinaryPublicId(myProfile.avatar_url); // Extract public ID from existing custom avatar URL

				const updatingCustomAvatar = await cloudinary.uploader.upload(
					req.file.path,
					{
						public_id: cloudinaryPublicId, // Same public ID to overwrite existing image
						overwrite: true,
					}
				);

				photo_url = updatingCustomAvatar.secure_url; // Get the updated image URL
			}

			const newPhotoUrl = {
				avatar_url: photo_url,
			};

			const result = await prisma.users.update({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				data: newPhotoUrl,
			});

			return commonHelper.response(
				res,
				newPhotoUrl,
				201,
				"Edit avatar success !"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	ChangePassword: async (req, res, next) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}
			let { old_password, new_password, new_password_confirmation } = req.body;

			const myProfile = await prisma.users.findUnique({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				select: { password: true },
			});

			if (!myProfile) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !"
				);
			}

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

			const oldPasswordValidation = await bcrypt.compare(
				old_password,
				myProfile.password
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

			if (new_password === old_password) {
				return commonHelper.response(
					res,
					null,
					400,
					"The new password must be different from the old password !"
				);
			}

			if (new_password !== new_password_confirmation) {
				// Validating new password confirmation
				return commonHelper.response(
					res,
					null,
					400,
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
			delete result.password; // Remove sensitive data from response

			return commonHelper.response(res, null, 201, "Change password success !");
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	DeleteMyAccount: async (req, res, next) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}
			let { email, password } = req.body; // Take email and password from client

			const myProfile = await prisma.users.findUnique({
				where: {
					id: req.user.id, // Get user id from userAuth middleware (token)
				},
				select: { email: true, password: true, avatar_url: true },
			});

			if (!myProfile) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !"
				);
			}

			// ------------------------ Input Validations ----------------------- //

			if (!email || !password) {
				return res.status(400).json({ message: "All fields are required !" });
			}

			email = email.toLowerCase();

			let errors = {}; // Object to hold every client errors

			errors = await userProfileInputCheck({
				email,
				password,
			});

			if (email !== req.user.email) {
				errors.email = "Email does not match authenticated user !";
			}

			if (Object.keys(errors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const isValidate = await bcrypt.compare(password, myProfile.password); // Comparing body password with password from 'findEmail'
			if (!isValidate) {
				// Validating password and email
				return commonHelper.response(res, null, 401, "Invalid password !");
			}

			if (myProfile.avatar_url !== USER_CONSTRAINT.DEFAULT_USER_AVATAR_URL) {
				const cloudinaryPublicId = getCloudinaryPublicId(myProfile.avatar_url); // Extract public ID from existing custom avatar URL
				await cloudinary.uploader.destroy(cloudinaryPublicId);
			}
			const deleteUser = await prisma.users.delete({
				where: {
					id: req.user.id,
				},
			});

			delete myProfile.password;
			password = null; // Clear sensitive data

			return commonHelper.response(
				res,
				null,
				200,
				"Account deleted successfully, please delete user token from browser local storage !"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	Logout: async (req, res, next) => {
		try {
			const deleteTempToken = await prisma.users.update({
				// Clear temp_token in database to invalidate token
				where: {
					id: req.user.id,
				},
				data: {
					temp_token: null,
				},
			});

			if (!deleteTempToken) {
				return commonHelper.response(
					res,
					null,
					403,
					"User not authenticated !"
				);
			}

			return commonHelper.response(
				res,
				null,
				200,
				"Logout success, please delete user token from browser local storage !"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},
};

module.exports = userController;
