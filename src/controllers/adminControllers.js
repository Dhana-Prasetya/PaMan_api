const { generateToken } = require("../helper/auth");
const bcrypt = require("bcryptjs");
const commonHelper = require("../helper/common.js");
const zodValidator = require("zod");
const { PrismaClient } = require("@prisma/client");
const {
	STRING_CONSTRAINT,
	PAGINATION_CONSTRAINT,
} = require("../config/inputConstraint.js");
const paginationCheck = require("../helper/paginationCheck.js");

const prisma = new PrismaClient();

const adminController = {
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

			const dataInDb = await prisma.admin.findUnique({
				where: {
					email: email,
				},
				select: {
					id: true,
					username: true,
					email: true,
					password: true,
					role: true,
					avatar_url: true,
				},
			});

			if (!dataInDb) {
				// Validating email
				return commonHelper.response(
					res,
					null,
					401,
					"Invalid password or email !"
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
				id: dataInDb.id,
				email: dataInDb.email,
				role: dataInDb.role,
			};

			dataInDb.token = generateToken(payload); // Create token and add to dataInDb object

			const updateTempToken = await prisma.admin.update({
				// Store temp_token in database for token validation
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

	Logout: async (req, res, next) => {
		try {
			const deleteTempToken = await prisma.admin.update({
				// Clear temp_token in database to invalidate token
				where: {
					id: req.admin.id,
				},
				data: {
					temp_token: null,
				},
			});

			return commonHelper.response(res, null, 200, "Logout success !");
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal server error");
		}
	},

	ListOfEveryUserPaginated: async (req, res) => {
		try {
			let {
				sort = "all",
				page = PAGINATION_CONSTRAINT.DEFAULT_PAGE_POSITION,
				limit = PAGINATION_CONSTRAINT.DEFAULT_ITEMS_PER_PAGE,
			} = req.query;

			sort = sort.toLowerCase(); // Convert sort to lowercase for uniformity

			// ------------------------ Input Validations ----------------------- //

			if (!sort || !isNaN(sort)) {
				commonHelper.response(
					res,
					null,
					400,
					"Sort parameter is invalid and must contain letters ! The default query sort are 'all', while specific sort options are 'user', 'admin'."
				);
			}

			page = Number(page);
			limit = Number(limit);

			let paginationErrors = {};
			paginationErrors = paginationCheck(page, limit);

			if (Object.keys(paginationErrors).length > 0) {
				// If there is any error, return the errors
				return res.status(400).json({ paginationErrors });
			}

			// ------------------------ Input Validations ----------------------- //

			let userResults = null;
			let adminResults = null;

			let skip = null;
			let total = null;
			let totalPages = null;

			let payload = null;

			if (sort === "all") {
				// ------------------------ Pagination Logic ----------------------- //
				skip = (page - 1) * limit;
				total = (await prisma.users.count()) + (await prisma.admin.count());
				totalPages = Math.ceil(total / limit);
				// ------------------------ Pagination Logic ----------------------- //

				userResults = await prisma.users.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				adminResults = await prisma.admin.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				const combinedList = [
					...userResults.map((u) => ({ ...u, role: "User" })),
					...adminResults.map((a) => ({ ...a, role: "Admin" })),
				];

				payload = {
					role: "all",
					page,
					limit,
					total,
					totalPages,
					combinedList,
				};
			} else if (sort === "user") {
				// ------------------------ Pagination Logic ----------------------- //
				skip = (page - 1) * limit;
				total = await prisma.users.count();
				totalPages = Math.ceil(total / limit);
				// ------------------------ Pagination Logic ----------------------- //
				userResults = await prisma.users.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				payload = {
					role: "user",
					page,
					limit,
					total,
					totalPages,
					userResults,
				};
			} else if (sort === "admin") {
				// ------------------------ Pagination Logic ----------------------- //
				skip = (page - 1) * limit;
				total = await prisma.admin.count();
				totalPages = Math.ceil(total / limit);
				// ------------------------ Pagination Logic ----------------------- //
				adminResults = await prisma.admin.findMany({
					select: {
						username: true,
						email: true,
						avatar_url: true,
						role: true,
						register_date: true,
					},
					skip,
					take: limit,
					orderBy: { id: "asc" },
				});

				payload = {
					role: "admin",
					page,
					limit,
					total,
					totalPages,
					adminResults,
				};
			} else {
				return commonHelper.response(
					res,
					null,
					400,
					"Invalid sort option ! Available sort options: 'all', 'user' or 'admin'."
				);
			}

			return commonHelper.response(
				res,
				payload,
				200,
				"List of users fetched !"
			);
		} catch (error) {
			console.error(`\n${error}\n`);
			return commonHelper.response(res, null, 500, "Internal Server Error");
		}
	},
};

module.exports = adminController;
