const removeNullProperties = (obj) => {
	return Object.keys(obj).reduce((acc, key) => {
		if (obj[key] != null) {
			acc[key] = obj[key];
		}
		return acc;
	}, {});
};

module.exports = removeNullProperties;
