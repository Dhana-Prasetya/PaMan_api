const zodValidator = require("zod");
const {
	USER_CONSTRAINT,
	STRING_CONSTRAINT,
	DATE_CONSTRAINT,
	CONTACT_CONSTRAINT,
} = require("../config/inputConstraint.js");
const isValidYYYYMMDD = require("./isValidYYYYMMDD.js");

async function inputCheck({
	username = null,
	name = null,
	email = null,
	password = null,
	phone_number = null,
	gender = null,
	birthday = null,
	message = null,
}) {
	const errors = {}; // Object to hold every client errors

	const allowedRegex = STRING_CONSTRAINT.ALLOWED_STRING_REGEX;

	if (username) {
		const allowedUsernameCheck = allowedRegex.test(username);

		if (
			!isNaN(username) ||
			username.length > USER_CONSTRAINT.MAX_USERNAME_LENGTH ||
			username.length < USER_CONSTRAINT.MIN_USERNAME_LENGTH ||
			!allowedUsernameCheck
		) {
			// Input validation (client always send as string)
			errors.username = `Username must contain letters and be between ${USER_CONSTRAINT.MIN_USERNAME_LENGTH} and ${USER_CONSTRAINT.MAX_USERNAME_LENGTH} characters long ! !`;
		}
	}

	if (name) {
		const allowedNameCheck = allowedRegex.test(name);

		if (
			!isNaN(name) ||
			name.length > STRING_CONSTRAINT.MAX_VARCHAR ||
			name.length < USER_CONSTRAINT.MIN_USERNAME_LENGTH ||
			!allowedNameCheck
		) {
			// Input validation (client always send as string)
			errors.name = `Name must contain letters and be between ${USER_CONSTRAINT.MIN_USERNAME_LENGTH} and ${STRING_CONSTRAINT.MAX_VARCHAR} characters long ! !`;
		}
	}

	if (email) {
		const emailCheck = zodValidator.string().email(); // Email input validator
		if (!emailCheck.safeParse(email).success) {
			errors.email = "Invalid email format !";
		}
	}

	if (password) {
		const passwordCheck = zodValidator.string().min(8);

		if (!passwordCheck.safeParse(password).success) {
			errors.password = "Password need to be at least 8 characters long !";
		}
	}

	if (phone_number) {
		if (
			isNaN(phone_number) ||
			phone_number.length > USER_CONSTRAINT.PHONE_NUMBER_MAX_VARCHAR ||
			phone_number.length < USER_CONSTRAINT.PHONE_NUMBER_MIN_VARCHAR
		) {
			errors.phone_number = `Phone number must contain only digits between ${USER_CONSTRAINT.PHONE_NUMBER_MIN_VARCHAR} and ${USER_CONSTRAINT.PHONE_NUMBER_MAX_VARCHAR} characters long !`;
		}
	}

	if (gender) {
		if (!USER_CONSTRAINT.GENDER_ENUM.includes(gender)) {
			errors.gender =
				"Gender only support ''Laki'', ''Perempuan'', or ''Rahasia''";
		}
	}

	if (birthday) {
		const dateCheck = isValidYYYYMMDD(birthday);

		if (!dateCheck) {
			// return boolean
			errors.birthday = "Birthday date format is invalid !";
		}

		birthday = new Date(birthday);

		if (
			new Date(birthday) < DATE_CONSTRAINT.MIN_DATE ||
			new Date(birthday) > DATE_CONSTRAINT.MAX_DATE
		) {
			errors.birthday = "Birthday date is out of valid range !";
		}
	}

	if (message) {
		if (
			!isNaN(message) ||
			message.length > CONTACT_CONSTRAINT.MAX_MESSAGE_VARCHAR
		) {
			errors.message = `Message must contain letters and be at most ${CONTACT_CONSTRAINT.MAX_MESSAGE_VARCHAR} characters long !`;
		}
	}

	return errors;
}

module.exports = inputCheck;
