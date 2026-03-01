// Adapter to translates Express (req, res) -> Plain Object -> Controller
const logger = require("../logger/pino-logger");
const errorMapper = require("../../interfaces/helper/errorMappers");

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
			const responseCookies = Array.isArray(httpResponse.cookies)
				? httpResponse.cookies
				: [];

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

			for (const cookie of responseCookies) {
				if (!cookie?.name) continue;
				res.cookie(cookie.name, cookie.value, cookie.options || {});
			}

			res.status(statusCode).json(body);
		} catch (error) {
			const mappedError = errorMapper.toResponse(error);
			const {
				// Destructure the mapped error to get the public response and logging details
				publicResponse,
				logLevel = "error",
				logMessage = "Unhandled internal error",
			} = mappedError;

			if (typeof requestLogger?.[logLevel] === "function") {
				requestLogger[logLevel]({ err: error }, logMessage);
			} else {
				requestLogger?.error?.({ err: error }, logMessage);
			}

			res.status(publicResponse.statusCode).json(publicResponse.body);
		}
	};
};

module.exports = { expressAdapter };
