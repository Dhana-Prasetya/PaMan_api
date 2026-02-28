// Domain layer: Use cases and business logic
const RegisterUser = require("../../domain/use_cases/RegisterUser");
const LoginUser = require("../../domain/use_cases/LoginUser");

const UserRepository = require("../repositories/UserRepository");
const PasswordService = require("../repositories/PasswordService");
const UserController = require("../../interfaces/controller/user-controller");
const buildUserRouter = require("../routes/userRoutes"); // CLEAN

const envValue = {
	defaultAvatarUrl: process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL,
};

const userRepository = new UserRepository();
const passwordService = new PasswordService();

// ------------------ Factory dependency injection for UserController and its dependencies ------------------
const registerUseCase = (userData) =>
	RegisterUser(userRepository, passwordService, userData, envValue);

const loginUseCase = (userData) =>
	LoginUser(userRepository, passwordService, userData, envValue); // TODO

const userController = UserController({ registerUseCase, loginUseCase }); // dependency injection for controller (and its use cases)

const UserRouter = buildUserRouter({ userController });

module.exports = { UserRouter };
