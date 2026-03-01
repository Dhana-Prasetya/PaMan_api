const { v4: uuidv4 } = require("uuid"); // For generating unique token identifiers

const generateUUID = () => {
	const uuid = uuidv4();
	return uuid;
};

module.exports = generateUUID;
