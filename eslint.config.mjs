import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		ignores: ["prisma/**"],
	},
	{
		files: ["**/*.{js,mjs,cjs}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: { globals: globals.node },
	},
	{ files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
	{
		rules: {
			"no-unused-vars": "warn",
			semi: ["warn", "always"],
			"capitalized-comments": ["warn", "always"],
		},
	},
]);
