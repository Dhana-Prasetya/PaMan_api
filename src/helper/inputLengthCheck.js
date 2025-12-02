const zodValidator = require("zod");
const {
	USER_CONSTRAINT,
	STRING_CONSTRAINT,
} = require("../config/inputConstraint.js");

async function inputLengthCheck({
	username = null,
	email = null,
	password = null,
	phone_number = null,
	gender = null,
}) {
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
}

module.exports = inputLengthCheck;
