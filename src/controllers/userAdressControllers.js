const { Prisma, PrismaClient } = require("@prisma/client");
const userAddressInputCheck = require("../helper/userAddressInputCheck");
const commonHelper = require("../helper/common");
const serialIdCheck = require("../helper/serial-id-check");
const prisma = new PrismaClient();

const userAdressControllers = {
	AddUserAddress: async (req, res) => {
		// ------------------------ Input Validations ----------------------- //

		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}

			let { street, kecamatan, city, province, postal_code } = req.body;

			if (!street || !kecamatan || !city || !province || !postal_code) {
				return res.status(400).json({ message: "All fields are required !" });
			}

			const errors = userAddressInputCheck({
				street,
				kecamatan,
				city,
				province,
				postal_code,
			});

			if (Object.keys(errors).length > 0) {
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const transaction = await prisma.$transaction(
				async (tx) => {
					let defaultAddress = null;

					const checkDefaultAddress = await tx.user_address.findMany({
						where: {
							user_id: req.user.id,
						},
						select: {
							street: true,
						},
					});

					const emptyObject = Object.keys(checkDefaultAddress); // Check if the result is empty
					if (emptyObject.length === 0) {
						defaultAddress = true; // If empty, set as default address
					} else {
						defaultAddress = false;
					}

					const insertAddress = await tx.user_address.create({
						data: {
							user_id: req.user.id,
							street,
							kecamatan,
							city,
							province,
							postal_code,
							is_default: defaultAddress,
						},
					});

					return insertAddress;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
					setTimeout: 10000,
				}
			);

			return res.status(201).json({
				message: "Address added successfully",
				data: transaction,
			});
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, `Internal server error`);
		}
	},

	GetUserAddresses: async (req, res) => {
		try {
			const userAddresses = await prisma.user_address.findMany({
				where: {
					user_id: req.user.id,
				},
			});

			const emptyData = Object.keys(userAddresses); // Check if the result is empty

			if (emptyData.length === 0) {
				return commonHelper.response(
					res,
					null,
					404,
					`No addresses found for this user !`
				);
			}

			return commonHelper.response(
				res,
				userAddresses,
				200,
				`User addresses retrieved successfully !`
			);
		} catch (error) {
			console.error(error);
			return commonHelper.response(res, null, 500, `Internal server error`);
		}
	},

	SetDefaultUserAddresses: async (req, res) => {
		try {
			let { id } = req.params;

			// ------------------------ Input Validations ----------------------- //

			if (!id) {
				return res
					.status(400)
					.json({ message: "Address ID param is required !" });
			}

			id = Number(id);
			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return res.status(400).json({ idCheck });
			}

			// ------------------------ Input Validations ----------------------- //

			const setDefaultAddressTransaction = await prisma.$transaction(
				async (tx) => {
					const setNonDefault = await tx.user_address.updateMany({
						// First, unset the current default address
						where: {
							user_id: req.user.id,
							is_default: true,
						},
						data: { is_default: false },
					});

					const setDefault = await tx.user_address.updateMany({
						// Then, set the new default address
						where: {
							user_id: req.user.id,
							id: id,
						},
						data: { is_default: true },
					});

					return setDefault;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
					setTimeout: 10000,
				}
			);

			return commonHelper.response(
				res,
				setDefaultAddressTransaction,
				200,
				`Default address updated successfully !`
			);
		} catch (error) {
			if (error.code === "P2025") {
				return commonHelper.response(res, null, 404, `Address not found !`);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, `Internal server error`);
		}
	},

	UpdateUserAddresses: async (req, res) => {
		try {
			if (!req.body) {
				return res.status(400).json({ message: "Request body is missing !" });
			}

			let { street, kecamatan, city, province, postal_code } = req.body;
			let { id } = req.params;

			// ------------------------ Input Validations ----------------------- //

			if (!id) {
				return res
					.status(400)
					.json({ message: "Address ID param is required !" });
			}

			id = Number(id);

			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return res.status(400).json({ idCheck });
			}

			if (!street || !kecamatan || !city || !province || !postal_code) {
				return res.status(400).json({ message: "All fields are required !" });
			}

			const errors = userAddressInputCheck({
				street,
				kecamatan,
				city,
				province,
				postal_code,
			});

			if (Object.keys(errors).length > 0) {
				return res.status(400).json({ errors });
			}

			// ------------------------ Input Validations ----------------------- //

			const updateAddress = await prisma.user_address.update({
				where: { id: id },
				data: {
					street,
					kecamatan,
					city,
					province,
					postal_code,
				},
			});

			return res.status(201).json({
				message: "Address updated successfully",
				data: updateAddress,
			});
		} catch (error) {
			if (error.code === "P2025") {
				return commonHelper.response(res, null, 404, `Address not found !`);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, `Internal server error`);
		}
	},

	DeleteUserAddresses: async (req, res) => {
		try {
			let { id } = req.params;

			// ------------------------ Input Validations ----------------------- //

			if (!id) {
				return res
					.status(400)
					.json({ message: "Address ID param is required !" });
			}

			id = Number(id);
			const idCheck = serialIdCheck(id);

			if (idCheck !== true) {
				// If there is any error, return the errors
				return res.status(400).json({ idCheck });
			}

			// ------------------------ Input Validations ----------------------- //

			let deletedAddress = null;

			const deleteAddressTransaction = await prisma.$transaction(
				async (tx) => {
					// 1. CHECK: Find the address and check its default status (using findFirst)
					const addressToDelete = await tx.user_address.findFirst({
						where: { id: id, user_id: req.user.id },
						select: { is_default: true },
					});

					// Fail early if address not found or doesn't belong to user (Optional, but safe)
					if (!addressToDelete) {
						throw new Error("ADDRESS_NOT_FOUND");
					}

					// 2. CONDITIONAL LOGIC: If the address is the current default
					if (addressToDelete.is_default === true) {
						// Find one replacement address (any address belonging to the user, except the one to be deleted)
						const replacementAddress = await tx.user_address.findFirst({
							where: {
								user_id: req.user.id,
								id: { not: id }, // Exclude the current address
							},
							select: { id: true },
						});

						deletedAddress = await tx.user_address.delete({
							where: { id: id },
						});

						// If a replacement was found, set it as the new default
						if (replacementAddress) {
							await tx.user_address.update({
								where: { id: replacementAddress.id },
								data: { is_default: true }, // SET NEW DEFAULT
							});
						}
					} else {
						// If not default, simply delete the address

						deletedAddress = await tx.user_address.delete({
							where: { id: id },
						});
					}

					return deletedAddress;
				},
				{
					isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
					timeout: 10000,
				}
			);

			return commonHelper.response(
				res,
				deleteAddressTransaction,
				200,
				`Addresses deleted successfully !`
			);
		} catch (error) {
			if (error.message === "ADDRESS_NOT_FOUND") {
				return commonHelper.response(res, null, 404, `Address not found !`);
			}
			console.error(error);
			return commonHelper.response(res, null, 500, `Internal server error`);
		}
	},
};

module.exports = userAdressControllers;
