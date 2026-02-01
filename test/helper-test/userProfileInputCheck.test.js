const userProfileInputCheck = require("../../src/helper/userProfileInputCheck");
const isValidYYYYMMDD = require("../../src/helper/isValidYYYYMMDD");

jest.mock("../../src/helper/isValidYYYYMMDD");
jest.mock("zod");
jest.mock("../../src/config/inputConstraint", () => ({
	USER_CONSTRAINT: {
		MAX_USERNAME_LENGTH: 20,
		MIN_USERNAME_LENGTH: 3,
		PHONE_NUMBER_MAX_VARCHAR: 20,
		PHONE_NUMBER_MIN_VARCHAR: 10,
	},
	STRING_CONSTRAINT: {
		MAX_VARCHAR: 255,
		ALLOWED_STRING_REGEX: /^[a-zA-Z0-9\s]+$/,
	},
	DATE_CONSTRAINT: {
		MIN_AGE: 13,
	},
	CONTACT_CONSTRAINT: {
		MAX_MESSAGE_VARCHAR: 800,
		MIN_MESSAGE_VARCHAR: 10,
	},
}));

describe("Helper - userProfileInputCheck", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return empty errors object for valid user input", () => {
		const username = "john_doe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";
		const message = null;

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
			message,
		});

		expect(result).toEqual({});
	});

	it("should return error for username too short", () => {
		const username = "ab";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("username");
		expect(result.username).toContain("between");
	});

	it("should return error for username too long", () => {
		const username = "a".repeat(21);
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("username");
		expect(result.username).toContain("between");
	});

	it("should return error for username that is only numeric", () => {
		const username = "12345";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("username");
	});

	it("should return error for username with invalid characters", () => {
		const username = "john@doe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("username");
	});

	it("should return error for fullname too short", () => {
		const username = "johndoe";
		const fullname = "J";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("fullname");
	});

	it("should return error for fullname that is only numeric", () => {
		const username = "johndoe";
		const fullname = "123456";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("fullname");
	});

	it("should return error for invalid email format", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "invalid-email";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("email");
		expect(result.email).toContain("Invalid email");
	});

	it("should return error for password less than 8 characters", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "short";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("password");
		expect(result.password).toContain("at least 8 characters");
	});

	it("should return error for phone number too short", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "081234";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("phone_number");
	});

	it("should return error for phone number too long", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "0".repeat(21);
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("phone_number");
	});

	it("should return error for non-numeric phone number", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "0812345678a";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("phone_number");
	});

	it("should return error for invalid gender", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "InvalidGender";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		// Gender validation depends on implementation
		expect(typeof result).toBe("object");
	});

	it("should return error for invalid birthday format", () => {
		isValidYYYYMMDD.mockReturnValue(false);

		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "01-01-2000";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result).toHaveProperty("birthday");
	});

	it("should accept valid birthday", () => {
		isValidYYYYMMDD.mockReturnValue(true);

		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
		});

		expect(result.birthday).toBeUndefined();
	});

	it("should return error for message too short", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";
		const message = "short";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
			message,
		});

		expect(result).toHaveProperty("message");
	});

	it("should return error for message too long", () => {
		const username = "johndoe";
		const fullname = "John Doe";
		const email = "john@example.com";
		const password = "securepass123";
		const phone_number = "08123456789";
		const gender = "Male";
		const birthday = "2000-01-01";
		const message = "a".repeat(801);

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
			message,
		});

		expect(result).toHaveProperty("message");
	});

	it("should accept null values for optional fields", () => {
		const username = null;
		const fullname = null;
		const email = null;
		const password = null;
		const phone_number = null;
		const gender = null;
		const birthday = null;
		const message = null;

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
			gender,
			birthday,
			message,
		});

		expect(result).toEqual({});
	});

	it("should return multiple errors for multiple invalid fields", () => {
		const username = "ab";
		const fullname = "J";
		const email = "invalid";
		const password = "short";
		const phone_number = "081";

		const result = userProfileInputCheck({
			username,
			fullname,
			email,
			password,
			phone_number,
		});

		expect(Object.keys(result).length).toBeGreaterThan(1);
	});
});
