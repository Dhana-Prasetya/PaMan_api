// Domain layer: Use cases and business logic
const RegisterUser = require("../../domain/use_cases/RegisterUser");
const ConventionalLogin = require("../../domain/use_cases/ConventionalLogin");
const SessionValidation = require("../../domain/use_cases/SessionValidation");

const UserRepository = require("../repositories/UserRepository");
const PasswordService = require("../repositories/PasswordService");
const RedisCacheRepository = require("../repositories/RedisCacheRepository");

const UserController = require("../../interfaces/controller/user-controller");
const buildUserRouter = require("../routes/userRoutes"); // CLEAN
const { GenerateToken } = require("../auth/GenerateToken");
const redisClient = require("../database/redisClient");
const buildUserCookieAuth = require("../middleware/userCookieAuth");

const envValue = {
	defaultAvatarUrl: process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL,
	env_stage: process.env.ENV_STAGE,
	secretKey: process.env.SECRET_KEY_JWT,
};

const userRepository = new UserRepository();
const passwordService = new PasswordService();
const generateToken = new GenerateToken();
const redisCacheRepository = new RedisCacheRepository(redisClient);

// ------------------ Factory dependency injection for UserController and its dependencies ------------------
const registerUseCase = (userData) =>
	RegisterUser(userRepository, passwordService, userData, envValue);

const conventionalLoginUseCase = (userData) =>
	ConventionalLogin(
		userRepository,
		passwordService,
		userData,
		generateToken,
		redisCacheRepository,
		envValue,
	);

const userController = UserController({
	registerUseCase,
	conventionalLoginUseCase,
}); // dependency injection for controller (and its use cases)

const UserRouter = buildUserRouter({ userController });

// ------------------ Factory dependency injection for Session Validation and its dependencies ------------------

const sessionValidationUseCase = (userData) =>
	SessionValidation(redisCacheRepository, userData);

const userCookieAuth = buildUserCookieAuth({ sessionValidationUseCase }); // Factory function for user cookie authentication middleware

module.exports = {
	UserRouter,
	userCookieAuth,
};
