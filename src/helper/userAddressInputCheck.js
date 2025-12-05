const { USER_ADDRESS_CONSTRAINT } = require("../config/inputConstraint");

function userAddressInputCheck({
	street,
	kecamatan,
	city,
	province,
	postal_code,
}) {
	const errors = {};

	if (street.length > USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN) {
		errors.street = `Street must be at most ${USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN} characters long`;
	}

	if (kecamatan.length > USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN) {
		errors.kecamatan = `Kecamatan must be at most ${USER_ADDRESS_CONSTRAINT.STREET_N_KECAMATAN} characters long`;
	}

	if (city.length > USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE) {
		errors.city = `City must be at most ${USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE} characters long`;
	}

	if (province.length > USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE) {
		errors.province = `Province must be at most ${USER_ADDRESS_CONSTRAINT.CITY_N_PROVINCE} characters long`;
	}

	if (
		postal_code.length > USER_ADDRESS_CONSTRAINT.POSTAL_CODE ||
		!isNaN(postal_code)
	) {
		errors.postal_code = `Postal code must be at most ${USER_ADDRESS_CONSTRAINT.POSTAL_CODE} characters long and must be a number`;
	}

	return errors;
}

module.exports = userAddressInputCheck;
