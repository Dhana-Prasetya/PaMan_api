const { USER_ADDRESS_CONSTRAINT } = require("../config/inputConstraint");

function userAddressInputCheck({
	recipient_name = null,
	street = null,
	kecamatan = null,
	city = null,
	province = null,
	postal_code = null,
	detail = null,
}) {
	const errors = {};

	const allowedRegex = USER_ADDRESS_CONSTRAINT.ALLOWED_STRING_REGEX;

	const MAX_STREET_N_KECAMATAN = USER_ADDRESS_CONSTRAINT.MAX_STREET_N_KECAMATAN;
	const MIN_STREET_N_KECAMATAN = USER_ADDRESS_CONSTRAINT.MIN_STREET_N_KECAMATAN;
	const MAX_CITY_N_PROVINCE = USER_ADDRESS_CONSTRAINT.MAX_CITY_N_PROVINCE;
	const MIN_CITY_N_PROVINCE = USER_ADDRESS_CONSTRAINT.MIN_CITY_N_PROVINCE;
	const POSTAL_CODE_LENGTH = USER_ADDRESS_CONSTRAINT.POSTAL_CODE;

	const MAX_RECIPIENT_NAME_VARCHAR =
		USER_ADDRESS_CONSTRAINT.MAX_RECIPIENT_NAME_VARCHAR;
	const MIN_RECIPIENT_NAME_VARCHAR =
		USER_ADDRESS_CONSTRAINT.MIN_RECIPIENT_NAME_VARCHAR;

	if (street) {
		const allowedStreetCheck = allowedRegex.test(street);
		if (
			street.length > MAX_STREET_N_KECAMATAN ||
			street.length < MIN_STREET_N_KECAMATAN ||
			!allowedStreetCheck ||
			!isNaN(street)
		) {
			errors.street = `Street can only contain letters, numbers, spaces, dots, dash, and commas and be between ${MIN_STREET_N_KECAMATAN} and ${MAX_STREET_N_KECAMATAN} characters long`;
		}
	}

	if (kecamatan) {
		const allowedKecamatanCheck = allowedRegex.test(kecamatan);
		if (
			kecamatan.length > MAX_STREET_N_KECAMATAN ||
			kecamatan.length < MIN_STREET_N_KECAMATAN ||
			!allowedKecamatanCheck ||
			!isNaN(kecamatan)
		) {
			errors.kecamatan = `Kecamatan can only contain letters, numbers, spaces, dots, dash, and commas and be between ${MIN_STREET_N_KECAMATAN} and ${MAX_STREET_N_KECAMATAN} characters long`;
		}
	}

	if (city) {
		const allowedCityCheck = allowedRegex.test(city);
		if (
			city.length > MAX_CITY_N_PROVINCE ||
			city.length < MIN_CITY_N_PROVINCE ||
			!allowedCityCheck ||
			!isNaN(city)
		) {
			errors.city = `City can only contain letters, numbers, spaces, dots, dash, and commas and be between ${MIN_CITY_N_PROVINCE} and ${MAX_CITY_N_PROVINCE} characters long`;
		}
	}

	if (province) {
		const allowedProvinceCheck = allowedRegex.test(province);
		if (
			province.length > MAX_CITY_N_PROVINCE ||
			province.length < MIN_CITY_N_PROVINCE ||
			!allowedProvinceCheck ||
			!isNaN(province)
		) {
			errors.province = `Province can only contain letters, numbers, spaces, dots, dash, and commas and be between ${MIN_CITY_N_PROVINCE} and ${MAX_CITY_N_PROVINCE} characters long`;
		}
	}

	if (postal_code) {
		const postal_code_num = Number(postal_code);
		const postal_code_int = Number.isInteger(postal_code_num);
		if (
			postal_code.length !== POSTAL_CODE_LENGTH ||
			isNaN(postal_code) ||
			!postal_code_int ||
			postal_code_num < 1
		) {
			errors.postal_code = `Postal code must be at ${POSTAL_CODE_LENGTH} characters long and must be an positive integer number`;
		}
	}

	if (detail) {
		if (!isNaN(detail)) {
			errors.detail = "Detail address must contain letters !";
		}
	}

	if (recipient_name) {
		const allowedAddressNameCheck = allowedRegex.test(recipient_name);

		if (
			!isNaN(recipient_name) ||
			recipient_name.length > MAX_RECIPIENT_NAME_VARCHAR ||
			recipient_name.length < MIN_RECIPIENT_NAME_VARCHAR ||
			!allowedAddressNameCheck
		) {
			// Input validation (client always send as string)
			errors.addressName = `Recipient name can only contain letters, number, dash, and space and be between ${MIN_RECIPIENT_NAME_VARCHAR} and ${MAX_RECIPIENT_NAME_VARCHAR} characters long !`;
		}
	}

	return errors;
}

module.exports = userAddressInputCheck;
