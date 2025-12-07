const zodValidator = require("zod");
const {
	USER_CONSTRAINT,
	STRING_CONSTRAINT,
	DATE_CONSTRAINT,
	CONTACT_CONSTRAINT,
} = require("../config/inputConstraint.js");
const isValidYYYYMMDD = require("./isValidYYYYMMDD.js");

async function userProfileInputCheck({
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
	const maxUsernameLength = USER_CONSTRAINT.MAX_USERNAME_LENGTH;
	const minUsernameLength = USER_CONSTRAINT.MIN_USERNAME_LENGTH;
	const maxPhoneNumberLength = USER_CONSTRAINT.PHONE_NUMBER_MAX_VARCHAR;
	const minPhoneNumberLength = USER_CONSTRAINT.PHONE_NUMBER_MIN_VARCHAR;
	const maxMessageLength = CONTACT_CONSTRAINT.MAX_MESSAGE_VARCHAR;
	const minMessageLength = CONTACT_CONSTRAINT.MIN_MESSAGE_VARCHAR;

	if (username) {
		const allowedUsernameCheck = allowedRegex.test(username);

		if (
			!isNaN(username) ||
			username.length > maxUsernameLength ||
			username.length < minUsernameLength ||
			!allowedUsernameCheck
		) {
			// Input validation (client always send as string)
			errors.username = `Username can only contain letters, number, and space and be between ${minUsernameLength} and ${maxUsernameLength} characters long !`;
		}
	}

	if (name) {
		const allowedNameCheck = allowedRegex.test(name);

		if (
			!isNaN(name) ||
			name.length > STRING_CONSTRAINT.MAX_VARCHAR ||
			name.length < minUsernameLength ||
			!allowedNameCheck
		) {
			// Input validation (client always send as string)
			errors.name = `Name can only contain letters, number, and space and be between ${minUsernameLength} and ${STRING_CONSTRAINT.MAX_VARCHAR} characters long !`;
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
		const positiveCheck = Number(phone_number);
		if (
			isNaN(phone_number) ||
			phone_number.length > maxPhoneNumberLength ||
			phone_number.length < minPhoneNumberLength ||
			positiveCheck < 1
		) {
			errors.phone_number = `Phone number must contain only positive integer digits between ${minPhoneNumberLength} and ${maxPhoneNumberLength} characters long !`;
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
			message.length > maxMessageLength ||
			message.length < minMessageLength
		) {
			errors.message = `Message must contain letters and be between ${minMessageLength} and ${maxMessageLength} characters long !`;
		}
	}

	return errors;
}

module.exports = userProfileInputCheck;
