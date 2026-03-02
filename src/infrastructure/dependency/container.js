// Domain layer: Use cases and business logic
const RegisterUser = require("../../domain/use_cases/RegisterUser");
const ConventionalLogin = require("../../domain/use_cases/ConventionalLogin");
const SessionValidation = require("../../domain/use_cases/SessionValidation");
const Logout = require("../../domain/use_cases/Logout");

const UseCaseLogger = require("../../domain/decorators/UseCaseLogger");

const UserRepository = require("../repositories/UserRepository");
const PasswordService = require("../repositories/PasswordService");
const RedisCacheRepository = require("../repositories/RedisCacheRepository");

const UserController = require("../../interfaces/controller/user-controller");
const buildUserRouter = require("../routes/userRoutes"); // CLEAN
const JWTToken = require("../auth/JWTToken");
const redisClient = require("../database/redisClient");
const buildUserCookieAuth = require("../middleware/userCookieAuth");
const logger = require("../logger/pino-logger");

// const envValue = {
// 	defaultAvatarUrl: process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL,
// 	env_stage: process.env.ENV_STAGE,
// 	secretKey: process.env.SECRET_KEY_JWT,
// };

// const userRepository = new UserRepository();
// const passwordService = new PasswordService();
// const jwtToken = new JWTToken();
// const redisCacheRepository = new RedisCacheRepository(redisClient);

// // ------------------ Factory dependency injection for UserController and its dependencies ------------------
// const coreRegisterUseCase = (userData) =>
// 	RegisterUser(userRepository, passwordService, userData, envValue);

// const registerUseCase = UseCaseLogger(
// 	coreRegisterUseCase,
// 	logger,
// 	"RegisterUser",
// ); // Decorator for logging use case execution

// const coreConventionalLoginUseCase = (userData) =>
// 	ConventionalLogin(
// 		userRepository,
// 		passwordService,
// 		userData,
// 		jwtToken,
// 		redisCacheRepository,
// 		envValue,
// 	);

// const conventionalLoginUseCase = UseCaseLogger(
// 	coreConventionalLoginUseCase,
// 	logger,
// 	"ConventionalLogin",
// ); // Decorator for logging use case execution

// const coreLogoutUseCase = (userToken) =>
// 	Logout(userToken, jwtToken, redisCacheRepository, envValue);

// const logoutUseCase = UseCaseLogger(coreLogoutUseCase, logger, "Logout"); // Decorator for logging use case execution

// const userController = UserController({
// 	registerUseCase,
// 	conventionalLoginUseCase,
// 	logoutUseCase,
// }); // Controller level dependency injection for use cases

// // ------------------ Factory dependency injection for Session Validation and its dependencies ------------------

// const sessionValidationUseCase = (
// 	userToken,
// 	allowedRole, // parameters needed for session validation
// ) =>
// 	SessionValidation(
// 		userToken,
// 		allowedRole,
// 		redisCacheRepository,
// 		jwtToken,
// 		envValue,
// 	);

// const userCookieAuth = buildUserCookieAuth({ sessionValidationUseCase }); // Factory function for user cookie authentication middleware

// const UserRouter = buildUserRouter({ userController, userCookieAuth }); // Route level dependency injection for controller and middleware

// module.exports = {
// 	UserRouter,
// 	userCookieAuth,
// };

const {
	createContainer,
	asValue,
	asClass,
	asFunction,
	InjectionMode,
} = require("awilix");

const container = createContainer({
	injectionMode: InjectionMode.PROXY, // This is key for the { dependency } syntax
});

container.register({
	// --- 1. Values & Infrastructure ---
	logger: asValue(logger),
	redisClient: asValue(redisClient),
	envValue: asValue({
		defaultAvatarUrl: process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL,
		env_stage: process.env.ENV_STAGE,
		secretKey: process.env.SECRET_KEY_JWT,
	}),

	// --- 2. Repositories & Services ---
	userRepository: asClass(UserRepository).singleton(),
	passwordService: asClass(PasswordService).singleton(),
	jwtToken: asClass(JWTToken).singleton(),
	redisCacheRepository: asClass(RedisCacheRepository).singleton(),

	// --- 3. Use Cases (Wrapped with Decorators) ---
	// We use asFunction because your UseCases seem to be factory functions
	registerUseCase: asFunction(
		({ userRepository, passwordService, envValue, logger }) => {
			const core = (userData) =>
				RegisterUser(userRepository, passwordService, userData, envValue);
			return UseCaseLogger(core, logger, "RegisterUser");
		},
	).scoped(),

	conventionalLoginUseCase: asFunction(
		({
			userRepository,
			passwordService,
			jwtToken,
			redisCacheRepository,
			envValue,
			logger,
		}) => {
			const core = (userData) =>
				ConventionalLogin(
					userRepository,
					passwordService,
					userData,
					jwtToken,
					redisCacheRepository,
					envValue,
				);
			return UseCaseLogger(core, logger, "ConventionalLogin");
		},
	).scoped(),

	logoutUseCase: asFunction(
		({ jwtToken, redisCacheRepository, envValue, logger }) => {
			const core = (userToken) =>
				Logout(userToken, jwtToken, redisCacheRepository, envValue);
			return UseCaseLogger(core, logger, "Logout");
		},
	).scoped(),

	// --- 4. Middleware & Controller ---
	sessionValidationUseCase: asFunction(
		({ redisCacheRepository, jwtToken, envValue }) => {
			// This returns a function that takes (userToken, allowedRole) later in the middleware
			return (userToken, allowedRole) =>
				SessionValidation(
					userToken,
					allowedRole,
					redisCacheRepository,
					jwtToken,
					envValue,
				);
		},
	),

	userController: asFunction(UserController).singleton(),
	userCookieAuth: asFunction(buildUserCookieAuth).singleton(),
});

// Export the things your app needs to start
module.exports = {
	container,
	UserRouter: buildUserRouter({
		userController: container.resolve("userController"),
		userCookieAuth: container.resolve("userCookieAuth"),
	}),
};
