const standarizedResponse = (result, status, message) => {
	// Standard response format
	return {
		statusCode: status,
		body: {
			status: "Success",
			statusCode: status,
			data: result,
			message: message,
		},
	};
};

module.exports = { standarizedResponse };
