const express = require("express");

// Adapter to translates Express (req, res) -> Plain Object -> Controller
const { expressAdapter } = require("../adapter/expressAdapter");
const completeUserRegisterData = require("../middleware/completeUserRegisterData");
const completeUserLoginData = require("../middleware/completeUserLoginData");

module.exports = ({ userController }) => {
	const router = express.Router();

	router.post(
		"/register",
		completeUserRegisterData,
		expressAdapter(userController.Register),
	);

	router.post(
		"/login",
		completeUserLoginData,
		expressAdapter(userController.Login),
	);

	return router;
};
