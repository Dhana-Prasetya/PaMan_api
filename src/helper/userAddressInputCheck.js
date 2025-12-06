const {
	USER_ADDRESS_CONSTRAINT,
	STRING_CONSTRAINT,
} = require("../config/inputConstraint");

function userAddressInputCheck({
	street,
	kecamatan,
	city,
	province,
	postal_code,
}) {
	const errors = {};

	const allowedRegex = STRING_CONSTRAINT.ALLOWED_STRING_REGEX;

	const allowedStreetCheck = allowedRegex.test(street);
	const allowedKecamatanCheck = allowedRegex.test(kecamatan);
	const allowedCityCheck = allowedRegex.test(city);
	const allowedProvinceCheck = allowedRegex.test(province);

	const postal_code_num = Number(postal_code);
	const postal_code_int = Number.isInteger(postal_code_num);

	if (
		street.length > USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN ||
		!allowedStreetCheck ||
		!isNaN(street)
	) {
		errors.street = `Street must contains letters and be at most ${USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN} characters long`;
	}

	if (
		kecamatan.length > USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN ||
		!allowedKecamatanCheck ||
		!isNaN(kecamatan)
	) {
		errors.kecamatan = `Kecamatan must contains letters and be at most ${USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN} characters long`;
	}

	if (
		city.length > USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE ||
		!allowedCityCheck ||
		!isNaN(city)
	) {
		errors.city = `City must contains letters and be at most ${USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE} characters long`;
	}

	if (
		province.length > USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE ||
		!allowedProvinceCheck ||
		!isNaN(province)
	) {
		errors.province = `Province must contains letters and be at most ${USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE} characters long`;
	}

	if (
		postal_code.length > USER_ADDRESS_CONSTRAINT.POSTAL_CODE ||
		isNaN(postal_code) ||
		!postal_code_int ||
		postal_code_num < 1
	) {
		errors.postal_code = `Postal code must be at most ${USER_ADDRESS_CONSTRAINT.POSTAL_CODE} characters long and must be an integer number`;
	}

	return errors;
}

module.exports = userAddressInputCheck;
