function getCloudinaryPublicId(url) {
	const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
	const match = url.match(regex);
	return match ? match[1] : null;
}

module.exports = { getCloudinaryPublicId };
