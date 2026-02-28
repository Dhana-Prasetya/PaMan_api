const globalResponseLogger = require("../helper/globalResponseLogger");

const completeUserRegisterData = (req, res, next) => {
	const { full_name, email, password, phone_number, gender } = req.body;

	const missingField = {};

	if (!full_name) {
		missingField.full_name = "Full name is required !";
	}
	if (!email) {
		missingField.email = "Email is required !";
	}
	if (!password) {
		missingField.password = "Password is required !";
	}
	if (!phone_number) {
		missingField.phone_number = "Phone number is required !";
	}
	if (!gender) {
		missingField.gender = "Gender is required !";
	}

	if (Object.keys(missingField).length > 0) {
		const error = new Error("Validation Failed");
		error.name = "IncompleteRegisterDataError";
		error.validationErrors = missingField;

		const { publicResponse } = globalResponseLogger(req, error);

		return res.status(publicResponse.statusCode).json(publicResponse.body);
	} else {
		next();
	}
};

module.exports = completeUserRegisterData;
