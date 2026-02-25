const express = require("express");
const router = express.Router();

const RegisterUser = require("../../domain/use_cases/RegisterUser");
const UserRepository = require("../../infrastructure/repositories/UserRepository");
const PasswordService = require("../../infrastructure/repositories/PasswordService");

const userController = require("../../interfaces/controller/user-controller")({
	// Dependency Injection
	registerUseCase: RegisterUser, // Function instance for use case
	userRepository: new UserRepository(), // class instance for
	passwordService: new PasswordService(),
});

// Adapter to translates Express (req, res) -> Plain Object -> Controller
const { expressAdapter } = require("../adapter/expressAdapter");

router.post("/register", expressAdapter(userController.Register));

module.exports = router;
