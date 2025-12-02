const ID_CONSTRAINT = {
	MAX_INT: 10000, // Ten thousand
	MIN_INT: 1, // One
};

const PRODUCT_CONSTRAINT = {
	MAX_PRICE: 300000, // Maximum price allowed, three hundred thousand
	MIN_PRICE: 0, // Minimum price allowed, zero
	CATEGORY_ENUM: ["Beras", "Sayur", "Buah"],
	DEFAULT_IMAGE_FOLDER: "products_images",
	MIN_STOCK: 0, // Minimum stock allowed
	MAX_STOCK: 1000, // Maximum stock allowed
	FILE_NAME_PREFIX: "product_id-",
};

const IMAGE_CONSTRAINT = {
	MAX_SIZE: 2 * 1024 * 1024, // 2MB
	ALLOWED_FORMATS: ["image/jpg", "image/jpeg", "image/png", "image/webp"], // Allowed image MIME types
};

const USER_CONSTRAINT = {
	PHONE_NUMBER_MAX_VARCHAR: 20, // Maximum length for phone number
	GENDER_ENUM: ["Laki", "Perempuan", "Rahasia"], // Allowed Gender values
	DEFAULT_USER_AVATAR_URL: process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL,
	USER_ROLE: "user",
	DEFAULT_IMAGE_FOLDER: "user_avatar",
};

const ADMIN_CONSTRAINT = {
	ADMIN_ROLE: "admin",
	FILE_NAME_PREFIX: "admin_id-",
};

const STRING_CONSTRAINT = {
	MAX_VARCHAR: 255, // Maximum length for VARCHAR in databases
};

const DATE_CONSTRAINT = {
	MIN_DATE: new Date("1909-08-21"), // Minimum date allowed
	MAX_DATE: new Date(), // Maximum date allowed
};

const PAGINATION_CONSTRAINT = {
	DEFAULT_ITEMS_PER_PAGE: 10, // Default items per page
	DEFAULT_PAGE_POSITION: 1, // Default starting page
	MAX_ITEMS_PER_PAGE: 30, // Maximum items allowed per page
};

module.exports = {
	ID_CONSTRAINT,
	STRING_CONSTRAINT,
	IMAGE_CONSTRAINT,
	USER_CONSTRAINT,
	PRODUCT_CONSTRAINT,
	PAGINATION_CONSTRAINT,
	ADMIN_CONSTRAINT,
	DATE_CONSTRAINT,
};
