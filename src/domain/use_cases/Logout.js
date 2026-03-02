const getRemainingCookieLifetime = require("../helper/getRemainingCookieLifetime");

module.exports = async (
	userToken,
	jwtToken,
	redisCacheRepository,
	envValue,
) => {
	const decodedToken = jwtToken.decodeToken(userToken, envValue.secretKey);
	const ttl = getRemainingCookieLifetime(decodedToken.exp);

	await redisCacheRepository.save(
		`at:revoked-${decodedToken.jti}`,
		decodedToken.id,
		ttl,
	);

	await redisCacheRepository.delete(`rt:${decodedToken.jti}`);
};
