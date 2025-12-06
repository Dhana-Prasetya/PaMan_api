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

	const allowedRegex = USER_ADDRESS_CONSTRAINT.ALLOWED_STRING_REGEX;

	const allowedStreetCheck = allowedRegex.test(street);
	const allowedKecamatanCheck = allowedRegex.test(kecamatan);
	const allowedCityCheck = allowedRegex.test(city);
	const allowedProvinceCheck = allowedRegex.test(province);

	const postal_code_num = Number(postal_code);
	const postal_code_int = Number.isInteger(postal_code_num);

	const MAX_STREET_N_KECAMATAN = USER_ADDRESS_CONSTRAINT.MAX_STREET_N_KECAMATAN;
	const MIN_STREET_N_KECAMATAN = USER_ADDRESS_CONSTRAINT.MIN_STREET_N_KECAMATAN;
	const MAX_CITY_N_PROVINCE = USER_ADDRESS_CONSTRAINT.MAX_CITY_N_PROVINCE;
	const MIN_CITY_N_PROVINCE = USER_ADDRESS_CONSTRAINT.MIN_CITY_N_PROVINCE;
	const POSTAL_CODE_LENGTH = USER_ADDRESS_CONSTRAINT.POSTAL_CODE;

	if (
		street.length > MAX_STREET_N_KECAMATAN ||
		street.length < MIN_STREET_N_KECAMATAN ||
		!allowedStreetCheck ||
		!isNaN(street)
	) {
		errors.street = `Street must contains letters and be between ${MIN_STREET_N_KECAMATAN} and ${MAX_STREET_N_KECAMATAN} characters long`;
	}

	console.log(street.length, kecamatan.length);

	if (
		kecamatan.length > MAX_STREET_N_KECAMATAN ||
		kecamatan.length < MIN_STREET_N_KECAMATAN ||
		!allowedKecamatanCheck ||
		!isNaN(kecamatan)
	) {
		errors.kecamatan = `Kecamatan must contains letters and be between ${MIN_STREET_N_KECAMATAN} and ${MAX_STREET_N_KECAMATAN} characters long`;
	}

	if (
		city.length > MAX_CITY_N_PROVINCE ||
		city.length < MIN_CITY_N_PROVINCE ||
		!allowedCityCheck ||
		!isNaN(city)
	) {
		errors.city = `City must contains letters and be between ${MIN_CITY_N_PROVINCE} and ${MAX_CITY_N_PROVINCE} characters long`;
	}

	if (
		province.length > MAX_CITY_N_PROVINCE ||
		province.length < MIN_CITY_N_PROVINCE ||
		!allowedProvinceCheck ||
		!isNaN(province)
	) {
		errors.province = `Province must contains letters and be between ${MIN_CITY_N_PROVINCE} and ${MAX_CITY_N_PROVINCE} characters long`;
	}

	if (
		postal_code.length !== POSTAL_CODE_LENGTH ||
		isNaN(postal_code) ||
		!postal_code_int ||
		postal_code_num < 1
	) {
		errors.postal_code = `Postal code must be at ${POSTAL_CODE_LENGTH} characters long and must be an integer number`;
	}

	return errors;
}

module.exports = userAddressInputCheck;
