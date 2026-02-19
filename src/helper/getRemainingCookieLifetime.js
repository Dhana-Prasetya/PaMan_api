const jwt = require("jsonwebtoken");

/**
 * Calculates the remaining lifetime of the JWT stored inside an HttpOnly cookie.
 * @param {Object} req - The Express request object
 * @param {string} cookieName - The name of your auth cookie (default: 'token')
 * @returns {number} - Remaining seconds until the JWT inside the cookie expires
 */
function getRemainingCookieLifetime(req, cookieName = 'token') {
    try {
        // 1. Get the token string from the cookies
        // Requires 'cookie-parser' to be active in your app
        const token = req.cookies[cookieName];

        if (!token) {
            return 0; // No cookie found, session is already "dead"
        }

        // 2. Decode the JWT to find the 'exp' (expiration) field
        const decoded = jwt.decode(token);

        if (!decoded || !decoded.exp) {
            return 0; // Token is malformed or has no expiration
        }

        // 3. Convert current time to Unix timestamp (seconds)
        const currentTimeSeconds = Math.floor(Date.now() / 1000);

        // 4. Calculate the difference
        const remainingSeconds = decoded.exp - currentTimeSeconds;

        // Return the remaining time (never negative)
        return Math.max(0, remainingSeconds);

    } catch (error) {
        console.error("Error calculating cookie lifetime:", error);
        return 0;
    }
}

module.exports = getRemainingCookieLifetime;