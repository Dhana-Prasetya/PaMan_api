const multer = require("multer"); // Calling multer package for handling multipart/form-data (file uploads)
const { response } = require("../helper/common.js");
const { IMAGE_CONSTRAINT } = require("../config/inputConstraint.js");

const maxSize = IMAGE_CONSTRAINT.MAX_SIZE; // 2MB

// Use multer limits to enforce file size server-side instead of relying on content-length header.
const multerUploadFile = multer({
	storage: multer.diskStorage({}),
	limits: { fileSize: maxSize },
	fileFilter: (req, file, cb) => {
		if (
			// If the file's mimetype is in the allowed formats, process continue
			IMAGE_CONSTRAINT.ALLOWED_FORMATS.includes(
				file.mimetype.toLowerCase().trim()
			)
		) {
			cb(null, true);
		} else {
			console.log(file.mimetype);
			const error = new Error("File must be in JPEG, JPG, PNG, or WEBP format");
			error.code = "INVALID_FILE_TYPE";
			return cb(error, false);
		}
	},
});

const upload = (req, res, next) => {
	// Middleware function to handle file upload

	// Accept either `photo` or `avatar` as the single file field.
	const multerHandler = multerUploadFile.fields([
		{ name: "photo", maxCount: 1 },
		{ name: "avatar", maxCount: 1 },
	]);

	multerHandler(req, res, (err) => {
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
			// Handle unexpected field errors with a clearer message
			if (
				err.code === "LIMIT_UNEXPECTED_FILE" ||
				/Unexpected field/i.test(err.message)
			) {
				return response(
					res,
					null,
					400,
					"Unexpected field. Upload field must be 'photo' or 'avatar'"
				);
			}
			// Fallback
			return response(res, null, 400, err.message || "File upload error");
		}

		// Normalize multer `.fields()` output to `req.file` so controllers
		// that expect `req.file` (like EditAvatar) continue to work.
		if (!req.file) {
			if (req.files) {
				if (req.files.photo && req.files.photo.length > 0)
					req.file = req.files.photo[0];
				else if (req.files.avatar && req.files.avatar.length > 0)
					req.file = req.files.avatar[0];
			}
		}

		next();
	});
};

module.exports = { upload };
