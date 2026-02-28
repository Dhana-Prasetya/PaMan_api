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
	IN_STOCK: "In-stock",
	OUT_OF_STOCK: "Out-of-stock",
	MAX_TEXT_VARCHAR: 4000,
	MAX_NAME_VARCHAR: 255,
	MIN_NAME_VARCHAR: 3,
	ALLOWED_NAME_REGEX: /^[a-zA-Z0-9\s\-_,.*:()#&|/=~]{3,255}$/, // Allow lower-capital case, num, space, and these symbols = (- . , _ - : = ' " () # & | / = ~)
	ALLOWED_DESCRIPTION_REGEX: /^[a-zA-Z0-9\s\-_,.*:()#&|/=~]{0,4000}$/, // Allow lower-capital case, num, space, and these symbols = (- . , _ - : = ' " () # & | / = ~)
};

const IMAGE_CONSTRAINT = {
	MAX_SIZE: 2 * 1024 * 1024, // 2MB
	ALLOWED_FORMATS: ["image/jpg", "image/jpeg", "image/png", "image/webp"], // Allowed image MIME types
};

const ORDER_CONSTRAINT = {
	STATUS_ENUM: ["Dikemas", "Dikirim", "Diterima", "Selesai"],
	USER_STATUS_ENUM: ["Dikemas", "Dikirim", "Selesai"],
};

const USER_CONSTRAINT = {
	PHONE_NUMBER_MAX_VARCHAR: 20, // Maximum length for phone number
	PHONE_NUMBER_MIN_VARCHAR: 10, // Minimum length for phone number
	GENDER_ENUM: ["Laki", "Perempuan", "Rahasia"], // Allowed Gender values
	DEFAULT_USER_AVATAR_URL: process.env.CLOUDINARY_DEFAULT_USER_AVATAR_URL,
	USER_ROLE: "user",
	DEFAULT_IMAGE_FOLDER: "user_avatar",
	MIN_USERNAME_LENGTH: 3, // Minimum username length
	MAX_USERNAME_LENGTH: 20, // Maximum username length
	FILE_NAME_PREFIX: "user_id-",
};

const CONTACT_CONSTRAINT = {
	MAX_MESSAGE_VARCHAR: 800,
	MIN_MESSAGE_VARCHAR: 5,
};

const ADMIN_CONSTRAINT = {
	ADMIN_ROLE: "admin",
	FILE_NAME_PREFIX: "admin_id-",
};

const STRING_CONSTRAINT = {
	MAX_VARCHAR: 255, // Maximum length for VARCHAR in databases
	MIN_VARCHAR: 1, // Minimum length for VARCHAR
	ALLOWED_STRING_REGEX: /^[a-zA-Z 0-9]+$/, // Allow lowercase, capitalcase letters, numbers, and space only
};

const DATE_CONSTRAINT = {
	MIN_DATE: new Date("1909-08-21"), // Minimum date allowed
	MAX_DATE: new Date(), // Maximum date allowed
};

const PAGINATION_CONSTRAINT = {
	DEFAULT_ITEMS_PER_PAGE: 5, // Default items per page
	DEFAULT_PAGE_POSITION: 1, // Default starting page
	MAX_ITEMS_PER_PAGE: 30, // Maximum items allowed per page
	MAX_PAGE_POSITION: 20, // Maximum page position allowed
};

const USER_ADDRESS_CONSTRAINT = {
	MAX_STREET_N_KECAMATAN: 255,
	MAX_CITY_N_PROVINCE: 100,
	MIN_STREET_N_KECAMATAN: 3,
	MIN_CITY_N_PROVINCE: 4,
	POSTAL_CODE: 5, // Postal code length
	ALLOWED_STRING_REGEX: /^[a-zA-Z0-9 .,-]+$/, // Allow lowercase, capitalcase letters, dot, coma, numbers, dash, and space only
	MAX_RECIPIENT_NAME_VARCHAR: 50,
	MIN_RECIPIENT_NAME_VARCHAR: 3,
};

const PAYMENT_CONSTRAINT = {
	PACKAGING_FEE: 2500, // Example fixed packaging fee
	SHIPPING_FEE: 8000, // Example fixed shipping fee
};

module.exports = {
	ID_CONSTRAINT,
	STRING_CONSTRAINT,
	IMAGE_CONSTRAINT,
	USER_CONSTRAINT,
	PRODUCT_CONSTRAINT,
	PAGINATION_CONSTRAINT,
	ADMIN_CONSTRAINT,
	CONTACT_CONSTRAINT,
	DATE_CONSTRAINT,
	USER_ADDRESS_CONSTRAINT,
	ORDER_CONSTRAINT,
	PAYMENT_CONSTRAINT,
};
