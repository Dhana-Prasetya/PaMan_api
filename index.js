// ---------------------------------------- Library imports and initializations ----------------------------------------

require("dotenv").config(); // Load environment variables from .env file into process.env
const port = process.env.BACKEND_RUNNING_PORT || 5000; // Set port from environment variable
const express = require("express"); // Calling express module
const app = express(); // Create instance of express
const cors = require("cors"); // Calling cors package to select which origin can access the backend
const morgan = require("morgan"); // Calling morgan package for logging
const helmet = require("helmet"); // Calling helmet package for security headers by telling browser to block unknown sources
const rateLimit = require("express-rate-limit");

// ---------------------------------------- Cors ----------------------------------------

const corsOptions = {
	// CORS configuration options
	origin: "*",
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
	morgan('\n:local :ip ":method :url" :status :response-time ms - :user-agent')
);

// Tell Express to trust the proxy (ngrok)
// app.set("trust proxy", true);

// ---------------------------------------- Helmet, JSON Parse, Malformed JSON handling ----------------------------------------

app.use(helmet()); // Use helmet middleware for setting security headers for browser

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

app.listen(port, () => {
	// Port listening
	console.log(`\nServer running on http://localhost:${port}`);
});
