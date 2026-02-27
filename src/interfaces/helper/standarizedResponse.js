const standarizedResponse = (result, status, message) => {
	let confirmation;

	if (status >= 400) {
		confirmation = "Failed";
	} else {
		confirmation = "Success";
	}
	// Standard response format
	return {
		statusCode: status,
		body: {
			status: confirmation,
			statusCode: status,
			data: result,
			message: message,
		},
	};
};

module.exports = { standarizedResponse };
