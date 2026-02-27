// Adapter to translates Express (req, res) -> Plain Object -> Controller
const logger = require("../logger/pino-logger");

const expressAdapter = (controllerFn, { appLogger = logger } = {}) => {
	return async (req, res) => {
		const requestLogger =
			typeof appLogger.child === "function"
				? appLogger.child({
						requestId: req.id || req.headers["x-request-id"],
						method: req.method,
						url: req.originalUrl,
					})
				: appLogger;

		const httpRequest = {
			// Structure the incoming request into a plain object for the controller
			body: req.body,
			query: req.query,
			params: req.params,
			context: {
				logger: requestLogger,
			},
		};

		try {
			const httpResponse = await controllerFn(httpRequest);
			const statusCode = httpResponse.statusCode;
			let body = httpResponse.body;

			if (!body) {
				requestLogger?.error?.("Controller returned empty response body");
				body = {
					status: "Error",
					statusCode: 500,
					data: null,
					message: "Invalid controller response",
				};
			}

			requestLogger?.info?.({ statusCode }, "Request handled");

			res.status(statusCode).json(body);
		} catch (error) {
			requestLogger?.error?.({ err: error }, "Unhandled internal error");
			res.status(500).json({
				status: "Error",
				statusCode: 500,
				data: null,
				message: "Internal server error",
			});
		}
	};
};

module.exports = { expressAdapter };
