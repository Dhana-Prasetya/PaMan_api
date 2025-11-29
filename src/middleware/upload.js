const multer = require("multer"); // Calling multer package for handling multipart/form-data (file uploads)
const { response } = require("../helper/common.js");
const limit = require("../config/limit.js");

const maxSize = limit.imgMaxSize; // 2MB

// Use multer limits to enforce file size server-side instead of relying on content-length header.
const multerUploadFile = multer({
	storage: multer.diskStorage({}),
	limits: { fileSize: maxSize },
	fileFilter: (req, file, cb) => {
		if (
			file.mimetype === "image/jpeg" ||
			file.mimetype === "image/png" ||
			file.mimetype === "image/jpg" ||
			file.mimetype === "image/webp"
		) {
			cb(null, true);
		} else {
			const error = new Error("File must be in JPEG, JPG, PNG, or WEBP format");
			error.code = "INVALID_FILE_TYPE";
			return cb(error, false);
		}
	},
});

const upload = (req, res, next) => {
	// Middleware function to handle file upload

	const multerSingle = multerUploadFile.single("photo");
	multerSingle(req, res, (err) => {
		if (err) {
			// Map Multer errors to appropriate HTTP status codes.
			if (err.code === "LIMIT_FILE_SIZE") {
				return response(
					res,
					null,
					413,
					`File too large. Max size is ${maxSize / (1024 * 1024)}MB`
				);
			}
			if (err.code === "INVALID_FILE_TYPE") {
				return response(res, null, 415, err.message || "Invalid file type");
			}
			// Fallback
			return response(res, null, 400, err.message || "File upload error");
		} else {
			next();
		}
	});
};

module.exports = { upload };
