// const { PrismaClient } = require("@prisma/client");
// const userAddressInputCheck = require("../helper/userAddressInputCheck");
// const commonHelper = require("../helper/common");
// const prisma = new PrismaClient();

// const userAdressControllers = {
// 	AddUserAddress: async (req, res) => {
// 		// ------------------------ Input Validations ----------------------- //

// 		try {
// 			const { street, kecamatan, city, province, postal_code } = req.body;

// 			if (!street || !kecamatan || !city || !province || !postal_code) {
// 				return res.status(400).json({ message: "All fields are required" });
// 			}

// 			const errors = userAddressInputCheck({
// 				street,
// 				kecamatan,
// 				city,
// 				province,
// 				postal_code,
// 			});

// 			if (Object.keys(errors).length > 0) {
// 				return res.status(400).json({ errors });
// 			}

// 			// ------------------------ Input Validations ----------------------- //

// 			const insertAddress = await prisma.user_address.create({
// 				data: {
// 					user_id: req.user.id,
// 					street,
// 					kecamatan,
// 					city,
// 					province,
// 					postal_code,
// 				},
// 			});

// 			return res.status(201).json({
// 				message: "Address added successfully",
// 				data: insertAddress,
// 			});
// 		} catch (error) {
// 			console.log(error);
// 			return res.status(500).json({ message: "Internal server error" });
// 		}
// 	},

// 	GetUserAddresses: async (req, res) => {
// 		try {
// 			const userAddresses = await prisma.user_address.findMany({
// 				where: {
// 					user_id: req.user.id,
// 				},
// 			});

// 			const emptyData = Object.keys(userAddresses); // Check if the result is empty

// 			if (emptyData.length === 0) {
// 				return commonHelper.response(
// 					res,
// 					null,
// 					404,
// 					`No addresses found for this user !`
// 				);
// 			}

// 			return commonHelper.response(
// 				res,
// 				userAddresses,
// 				200,
// 				`User addresses retrieved successfully !`
// 			);
// 		} catch (error) {
// 			console.log(error);
// 			return res.status(500).json({ message: "Internal server error" });
// 		}
// 	},
// };

// module.exports = userAdressControllers;
