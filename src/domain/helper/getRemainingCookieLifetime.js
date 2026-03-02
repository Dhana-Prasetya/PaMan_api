function getRemainingCookieLifetime(tokenExp) {
	if (!tokenExp) {
		return 0; // No cookie found, session is already "dead"
	}

	// 3. Convert current time to Unix timestamp (seconds)
	const currentTimeSeconds = Math.floor(Date.now() / 1000);

	// 4. Calculate the difference
	const remainingSeconds = tokenExp - currentTimeSeconds;

	// Return the remaining time (never negative)
	return Math.max(0, remainingSeconds);
}

module.exports = getRemainingCookieLifetime;
