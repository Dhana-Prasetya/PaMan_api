const globalResponseLogger = require("../helper/globalResponseLogger");

const completeUserLoginData = (req, res, next) => {
	const { email, password } = req.body;

	const missingField = {};

	if (!email) {
		missingField.email = "Email is required !";
	}
	if (!password) {
		missingField.password = "Password is required !";
	}

	if (Object.keys(missingField).length > 0) {
		const error = new Error("Validation Failed");
		error.name = "IncompleteLoginDataError";
		error.validationErrors = missingField;

		const { publicResponse } = globalResponseLogger(req, error);

		return res.status(publicResponse.statusCode).json(publicResponse.body);
	} else {
		next();
	}
};

module.exports = completeUserLoginData;
