const idConstraint = {
	maxInt: 10000, // Ten thousand
	minInt: 0, // Zero
};

const productConstraint = {
	maxPrice: 300000, // Maximum price allowed, three hundred thousand
	categoryEnum: ["Beras", "Sayur", "Buah"],
	defaultImageFolder: "products/",
	minStock: 0, // Minimum stock allowed
	maxStock: 1000, // Maximum stock allowed
};

const imageConstraint = {
	maxSize: 2 * 1024 * 1024, // 2MB
};

const userConstraint = {
	phoneNumberMaxVarchar: 20, // Maximum length for phone number
	genderEnum: ["Laki", "Perempuan", "Rahasia"], // Allowed Gender values
	defaultUserAvatarUrl:
		"https://res.cloudinary.com/dvyp8qsmz/image/upload/v1764497251/default_avatar_uvjjgy.png",
	userRole: "user",
	adminRole: "admin",
	defaultImageFolder: "users/",
};

const stringConstraint = {
	maxVarchar: 255, // Maximum length for VARCHAR in databases
};

const paginationConstraint = {
	defaultItemsPerPage: 10, // Default items per page
	defaultPagePosition: 1, // Default starting page
	maxItemsPerPage: 30, // Maximum items allowed per page
};

module.exports = {
	idConstraint,
	stringConstraint,
	imageConstraint,
	userConstraint,
	productConstraint,
	paginationConstraint,
};
