// infrastructure/routes/userRoutes.js
const express = require("express");
const router = express.Router();

// This adapter translates Express (req, res) -> Plain Object -> Controller
const expressAdapter = (controllerFn) => {
	return async (req, res) => {
		const httpRequest = {
			body: req.body,
			query: req.query,
			params: req.params,
		};

		const httpResponse = await controllerFn(httpRequest);

		res.status(httpResponse.statusCode).json(httpResponse.body);
	};
};

router.post("/register", expressAdapter(UserController.Register));
