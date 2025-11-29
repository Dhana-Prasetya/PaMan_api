const defineConfig = require("prisma/config").defineConfig;
require("dotenv").config();

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	engine: "classic",
	datasource: {
		url: process.env.DATABASE_URL,
	},
});
