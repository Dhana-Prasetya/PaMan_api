function isValidYYYYMMDD(dateString) {
	// 1. REGEX CHECK: Check for the exact format YYYY-MM-DD
	const regex = /^\d{4}-\d{2}-\d{2}$/;

	if (!regex.test(dateString)) {
		return false;
	}

	// 2. CALENDAR VALIDITY CHECK: Check if the date is real (e.g., not Feb 30th)
	// The Date constructor is often forgiving, so we check for mismatches.
	const dateObject = new Date(dateString);

	// a) Check for Invalid Date object (e.g., if the string was "2025-13-01")
	if (isNaN(dateObject.getTime())) {
		return false;
	}

	// b) Check for Date Mismatch: The Date constructor might "roll over" an invalid date.
	// Example: new Date('2025-02-30') will often create 'March 2, 2025'.

	// Extract the year, month, and day parts from the original string
	const parts = dateString.split("-");
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10); // 1-based (Jan=1, Dec=12)
	const day = parseInt(parts[2], 10);

	// Get the year, month, and day from the parsed Date object
	const parsedYear = dateObject.getFullYear();
	// The Date object's getMonth() is 0-based (Jan=0, Dec=11), so we add 1
	const parsedMonth = dateObject.getMonth() + 1;
	const parsedDay = dateObject.getDate();

	// Check if the original parts match the parsed parts
	if (parsedYear !== year || parsedMonth !== month || parsedDay !== day) {
		return false;
	}

	// If both checks pass, the date is valid and in the correct format.
	return true;
}

module.exports = isValidYYYYMMDD; // return boolean
