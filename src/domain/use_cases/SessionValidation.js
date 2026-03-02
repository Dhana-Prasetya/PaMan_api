module.exports = async (
	userToken,
	allowedRole,
	redisCacheRepository,
	jwtToken,
	envValue,
) => {
	const decodedToken = jwtToken.decodeToken(userToken, envValue.secretKey);

	if (decodedToken.role !== allowedRole) {
		return false; // User does not have the required role for this session
	}

	const revokedATExist = await redisCacheRepository.get(
		`at:revoked-${decodedToken.jti}`,
	);

	if (revokedATExist) {
		return false; // Session is revoked
	}

	return true; // Session is valid
};
