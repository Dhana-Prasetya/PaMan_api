const errorMapper = require("../../interfaces/helper/errorMappers");
const logger = require("../logger/pino-logger");

const globalResponseLogger = (req, error, custom_message = null) => {
	const requestLogger =
		typeof logger.child === "function"
			? logger.child({
					requestId: req?.id || req?.headers?.["x-request-id"],
					method: req.method,
					url: req.originalUrl,
				})
			: logger;

	const { publicResponse, logLevel, logMessage } = errorMapper.toResponse(
		error,
		custom_message,
	);

	requestLogger[logLevel]({ err: error }, logMessage);

	return {
		publicResponse,
	};
};

module.exports = globalResponseLogger;
