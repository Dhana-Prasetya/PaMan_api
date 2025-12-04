function capitalizeFirstLetter(str) {
	if (typeof str !== "string" || str.length === 0) {
		return str; // Handle non-string or empty inputs
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = capitalizeFirstLetter;
