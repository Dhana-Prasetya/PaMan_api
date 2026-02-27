const express = require("express");

// Adapter to translates Express (req, res) -> Plain Object -> Controller
const { expressAdapter } = require("../adapter/expressAdapter");

module.exports = ({ userController }) => {
	const router = express.Router();

	router.post("/register", expressAdapter(userController.Register));

	return router;
};
