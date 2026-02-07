// ---------------------------------------- Library imports and initializations ----------------------------------------

require("dotenv").config(); // Load environment variables from .env file into process.env
const port = process.env.BACKEND_RUNNING_PORT || 5000; // Set port from environment variable
const express = require("express"); // Calling express module
const app = express(); // Create instance of express
const cors = require("cors"); // Calling cors package to select which origin can access the backend
const morgan = require("morgan"); // Calling morgan package for logging
const helmet = require("helmet"); // Calling helmet package for security headers by telling browser to block unknown sources
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const redis = require("redis");
const { RedisStore } = require("connect-redis");

// ---------------------------------------- Redis ----------------------------------------

const envStage = process.env.ENV_STAGE || "dev"; // Get environment stage from .env file
let redisSecure = null;

if (envStage === "prod") {
	redisSecure = true;
	app.set("trust proxy", 1);
}

const redisClient = redis.createClient({
	url: process.env.REDIS_URL, // Redis server cloud url
	legacyMode: true, // Use legacy mode for compatibility with connect-redis
});

redisClient.connect().catch(console.error);

const redisStore = new RedisStore({ client: redisClient });

app.use(
	session({
		name: process.env.REDIS_SESSION_ID, // Name of the session ID cookie to set in the browser
		store: redisStore, // Tell Express to use Redis for session storage
		secret: process.env.REDIS_UNIQUE_KEY, // Used to sign the session ID cookie. CHANGE THIS.
		resave: false, // Prevents session from being saved back to the store if it was never modified
		saveUninitialized: true, // Saves new sessions that have not been modified
		cookie: {
			secure: redisSecure, // Set to true if using HTTPS
			httpOnly: true, // Prevents client-side JS from reading the cookie
			maxAge: 1000 * 60 * 60 * 24, // 24 hours
		},
	}),
);

redisClient.on("error", (err) => {
	console.error("Could not connect to Redis:", err);
});

// ---------------------------------------- Cors ----------------------------------------

const corsOptions = {
	// CORS configuration options
	origin: process.env.CLIENT_URL, // Allow requests from this origin
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	preflightContinue: false,
	optionsSuccessStatus: 204,
};
app.use(cors(corsOptions)); // Use CORS middleware with specified options

// ---------------------------------------- Rate limiting ----------------------------------------

const apiCallLimiter = rateLimit({
	windowMs: 3 * 1000, // 3 seconds
	max: 1, // 1 request allowed per window
	message: {
		message: "Too many requests. Try again in 3 seconds.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(apiCallLimiter); // Apply rate limiting to all requests

// ---------------------------------------- Morgan http logging and ngrok proxy ----------------------------------------

morgan.token("ip", (req) => {
	// If behind proxy (NGINX, Vercel, etc.), prefer the forwarded header
	return req.headers["x-forwarded-for"] || req.ip;
});

morgan.token("local", () => {
	return new Date().toLocaleString();
});

app.use(
	morgan('\n:local :ip ":method :url" :status :response-time ms - :user-agent'),
);

// ---------------------------------------- Helmet, JSON Parse, Malformed JSON handling ----------------------------------------

app.use(helmet()); // Use helmet middleware for easier CSP and security headers

app.use(express.json()); // Middleware function to parse JSON bodies (turn json text stream into usable js object)

// Error handling for malformed JSON
app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
		return res.status(400).json({
			error: "Malformed JSON !",
		});
	}
	next();
});

BigInt.prototype.toJSON = function () {
	return this.toString();
};

// ---------------------------------------- Routes and port listen ----------------------------------------

const ProductRouter = require("./src/routes/productRoutes");
const UserRouter = require("./src/routes/userRoutes");
const AdminRouter = require("./src/routes/adminRoutes");
const contactRouter = require("./src/routes/contactRoutes");

app.use("/api/products", ProductRouter); // Prefix all routes/middleware in product.js in routes with '/products'
app.use("/api/user", UserRouter); // Prefix all routes/middleware in user.js in routes with '/users'
app.use("/api/admin", AdminRouter);
app.use("/api/contact", contactRouter);

app.use("/", (req, res) => {
	// Basic route for root path
	res.status(200).json({
		message: "Welcome to the Panenmania API ! This is the default route",
	});
});

// Centralized JSON error handler — convert http-errors to JSON responses
app.use((err, req, res, next) => {
	const status = err.status || err.statusCode || 500;
	const message = err.message || "Internal Server Error";
	// Log the error server-side for debugging
	console.error("Unhandled error:", err);
	res.status(status).json({ status, message });
});

app.listen(port, () => {
	// Port listening
	console.log(`\nServer running on http://localhost:${port}`);
});
