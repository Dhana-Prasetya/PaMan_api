const limit = {
	intMax: 10000, // Ten thousand
	intMin: 0, // Zero
	dbVarcharMax: 255, // Maximum length for VARCHAR in databases
	priceMax: 300000, // Maximum price allowed, three hundred thousand
	imgMaxSize: 2 * 1024 * 1024, // 2MB
	defaultLimitPerPage: 10, // Default items per page
	defaultPagePosition: 1, // Default starting page
	phoneNumberLimit: 20, // Maximum length for phone number
	genderEnum: ["Laki", "Perempuan", "Rahasia"], // Allowed Gender values
};

module.exports = limit;
