const pino = require("pino");

const logger = pino({
	level: process.env.ENV_STAGE === "production" ? "info" : "debug",
	// raw JSON for prod, pino-pretty for dev
	transport:
		process.env.ENV_STAGE !== "production"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname", // Removes clutter
					},
				}
			: undefined,
});

module.exports = logger;
