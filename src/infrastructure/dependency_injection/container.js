const RegisterUser = require("../../domain/use_cases/RegisterUser");
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

const userController = UserController({ registerUseCase });

const UserRouter = buildUserRouter({ userController });

module.exports = { UserRouter };
