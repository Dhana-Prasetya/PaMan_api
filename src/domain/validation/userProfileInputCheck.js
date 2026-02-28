const {
	USER_CONSTRAINT,
	STRING_CONSTRAINT,
	DATE_CONSTRAINT,
	CONTACT_CONSTRAINT,
} = require("../policies/inputConstraint.js");
const isValidYYYYMMDD = require("../helper/isValidYYYYMMDD.js");

function userProfileInputCheck(userData) {
	const errors = {}; // Object to hold every client errors

	const allowedRegex = STRING_CONSTRAINT.ALLOWED_STRING_REGEX;
	const maxUsernameLength = USER_CONSTRAINT.MAX_USERNAME_LENGTH;
	const minUsernameLength = USER_CONSTRAINT.MIN_USERNAME_LENGTH;
	const maxPhoneNumberLength = USER_CONSTRAINT.PHONE_NUMBER_MAX_VARCHAR;
	const minPhoneNumberLength = USER_CONSTRAINT.PHONE_NUMBER_MIN_VARCHAR;
	const maxMessageLength = CONTACT_CONSTRAINT.MAX_MESSAGE_VARCHAR;
	const minMessageLength = CONTACT_CONSTRAINT.MIN_MESSAGE_VARCHAR;
	const validEmailRegex = /@/;

	if (userData.username) {
		const allowedUsernameCheck = allowedRegex.test(userData.username);

		if (
			!isNaN(userData.username) ||
			userData.username.length > maxUsernameLength ||
			userData.username.length < minUsernameLength ||
			!allowedUsernameCheck
		) {
			// Input validation (client always send as string)
			errors.username = `Username can only contain letters, number, and space and be between ${minUsernameLength} and ${maxUsernameLength} characters long !`;
		}
	}

	if (userData.fullname) {
		const allowedNameCheck = allowedRegex.test(userData.fullname);

		if (
			!isNaN(userData.fullname) ||
			userData.fullname.length > STRING_CONSTRAINT.MAX_VARCHAR ||
			userData.fullname.length < minUsernameLength ||
			!allowedNameCheck
		) {
			// Input validation (client always send as string)
			errors.fullname = `Fullname can only contain letters, number, and space and be between ${minUsernameLength} and ${STRING_CONSTRAINT.MAX_VARCHAR} characters long !`;
		}
	}

	if (userData.email) {
		if (validEmailRegex.test(userData.email) === false) {
			errors.email = "Email format is invalid !";
		}
	}

	if (userData.password) {
		if (userData.password.length < 8) {
			errors.password = "Password need to be at least 8 characters long !";
		}
	}

	if (userData.phone_number) {
		const positiveCheck = Number(userData.phone_number);
		if (
			isNaN(positiveCheck) ||
			userData.phone_number.length > maxPhoneNumberLength ||
			userData.phone_number.length < minPhoneNumberLength ||
			positiveCheck < 1
		) {
			errors.phone_number = `Phone number must contain only positive integer digits between ${minPhoneNumberLength} and ${maxPhoneNumberLength} characters long !`;
		}
	}

	if (userData.gender) {
		if (!USER_CONSTRAINT.GENDER_ENUM.includes(userData.gender)) {
			errors.gender =
				"Gender only support ''Laki'', ''Perempuan'', or ''Rahasia''";
		}
	}

	if (userData.birthday) {
		const dateCheck = isValidYYYYMMDD(userData.birthday);

		if (!dateCheck) {
			// return boolean
			errors.birthday = "Birthday date format is invalid !";
		}

		const birthday = new Date(userData.birthday);

		if (
			new Date(birthday) < DATE_CONSTRAINT.MIN_DATE ||
			new Date(birthday) > DATE_CONSTRAINT.MAX_DATE
		) {
			errors.birthday = "Birthday date is out of valid range !";
		}
	}

	if (userData.message) {
		const message = userData.message;
		if (
			!isNaN(message) ||
			message.length > maxMessageLength ||
			message.length < minMessageLength
		) {
			errors.message = `Message must contain letters and be between ${minMessageLength} and ${maxMessageLength} characters long !`;
		}
	}

	if (Object.keys(errors).length > 0) {
		const error = new Error("Validation Failed");
		error.name = "UserProfileValidationError";
		error.validationErrors = errors;
		throw error;
	}
}

module.exports = userProfileInputCheck;
