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
	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			'res.headers["set-cookie"]',
			"input.password",
			"input.email",
			"input.phone_number",
			"input.gender",
			"input.token",
		],
		remove: true, // Instead of [REDACTED], it completely removes the key
	},
});

module.exports = logger;
