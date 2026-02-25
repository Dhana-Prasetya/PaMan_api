// Adapter to translates Express (req, res) -> Plain Object -> Controller
const expressAdapter = (controllerFn) => {
	return async (req, res) => {
		const httpRequest = {
			body: req.body,
			query: req.query,
			params: req.params,
		};

		const httpResponse = await controllerFn(httpRequest);
		const statusCode = httpResponse.statusCode;
		let body = httpResponse.body;

		if (!body) {
			body = {
				status: "Error",
				statusCode: 500,
				data: null,
				message: "Invalid controller response",
			};
		}

		res.status(statusCode).json(body);
	};
};

module.exports = { expressAdapter };
