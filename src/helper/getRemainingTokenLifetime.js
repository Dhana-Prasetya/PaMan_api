const jwt = require("jsonwebtoken");

function getExpiryTimestamp(token) {
	try {
		const decoded = jwt.decode(token);
		if (decoded && decoded.exp) {
			// The 'exp' is a Unix timestamp in seconds
			return decoded.exp;
		}
		return null;
	} catch (error) {
		// Handle malformed tokens
		console.error("Error decoding token:", error);
		return null;
	}
}

function getRemainingTokenLifetime(token) {
	const expTimestamp = getExpiryTimestamp(token);

	if (!expTimestamp) {
		return 0; // Return 0 or handle error appropriately
	}

	// 1. Get current time in seconds (Unix time)
	// Date.now() returns milliseconds, so divide by 1000
	const currentTimeSeconds = Math.floor(Date.now() / 1000);

	// 2. Calculate the difference
	const remainingSeconds = expTimestamp - currentTimeSeconds;

	// 3. Return the remaining time (never negative)
	// If remainingSeconds is negative, the token is already expired.
	return Math.max(0, remainingSeconds); // Return in seconds
}

module.exports = getRemainingTokenLifetime;
