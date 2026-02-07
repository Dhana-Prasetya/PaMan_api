const userAddressInputCheck = require("../../src/helper/userAddressInputCheck");
jest.mock("../../src/config/inputConstraint", () => ({
	USER_ADDRESS_CONSTRAINT: {
		ALLOWED_STRING_REGEX: /^[a-zA-Z0-9\s.,\-]+$/,
		MAX_STREET_N_KECAMATAN: 255,
		MIN_STREET_N_KECAMATAN: 3,
		MAX_CITY_N_PROVINCE: 100,
		MIN_CITY_N_PROVINCE: 2,
		POSTAL_CODE: 5,
		MAX_RECIPIENT_NAME_VARCHAR: 50,
		MIN_RECIPIENT_NAME_VARCHAR: 2,
	},
}));

describe("Helper - userAddressInputCheck", () => {
	it("should return empty errors object for valid address input", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Main Street",
			kecamatan: "Menteng",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
			detail: "Apt 4B",
		};

		const result = userAddressInputCheck(input);

		expect(result).toEqual({});
	});

	it("should return error for street too short", () => {
		const input = {
			recipient_name: "John Doe",
			street: "12",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("street");
		expect(result.street).toContain("between");
	});

	it("should return error for street too long", () => {
		const input = {
			recipient_name: "John Doe",
			street: "a".repeat(256),
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("street");
		expect(result.street).toContain("between");
	});

	it("should return error for street with invalid characters", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street @#$",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("street");
	});

	it("should return error for street that is only numbers", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123456",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("street");
	});

	it("should return error for kecamatan too short", () => {
		const input = {
			recipient_name: "John Doe",
			kecamatan: "M",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("kecamatan");
	});

	it("should return error for city too short", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street",
			kecamatan: "Menteng",
			city: "J",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("city");
	});

	it("should return error for city too long", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street",
			kecamatan: "Menteng",
			city: "a".repeat(101),
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("city");
	});

	it("should return error for province too short", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street",
			kecamatan: "Menteng",
			city: "Jakarta",
			province: "D",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("province");
	});

	it("should return error for province too long", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street",
			kecamatan: "Menteng",
			city: "Jakarta",
			province: "a".repeat(101),
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("province");
	});

	it("should return error for invalid postal code length", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street",
			kecamatan: "Menteng",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "121",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("postal_code");
	});

	it("should return error for non-numeric postal code", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Street",
			kecamatan: "Menteng",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "1216a",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("postal_code");
	});

	it("should return error for recipient name too short", () => {
		const input = {
			recipient_name: "J",
			street: "123 Street",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("recipient_name");
	});

	it("should return error for recipient name too long", () => {
		const input = {
			recipient_name: "a".repeat(51),
			street: "123 Street",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result).toHaveProperty("recipient_name");
	});

	it("should accept null values for optional fields", () => {
		const input = {
			recipient_name: "John Doe",
			street: null,
			kecamatan: null,
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
			detail: null,
		};

		const result = userAddressInputCheck(input);

		// Only required fields should be validated
		expect(result.street).toBeUndefined();
		expect(result.kecamatan).toBeUndefined();
	});

	it("should accept address with numbers", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Main Street Block 45",
			kecamatan: "Menteng 123",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result.street).toBeUndefined();
		expect(result.kecamatan).toBeUndefined();
	});

	it("should accept address with dashes and dots", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Main St. - Block A",
			kecamatan: "West-Menteng",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result.street).toBeUndefined();
		expect(result.kecamatan).toBeUndefined();
	});

	it("should accept address with commas", () => {
		const input = {
			recipient_name: "John Doe",
			street: "123 Main Street, Block 45",
			city: "Jakarta",
			province: "DKI Jakarta",
			postal_code: "12160",
		};

		const result = userAddressInputCheck(input);

		expect(result.street).toBeUndefined();
	});

	it("should return multiple errors if multiple fields are invalid", () => {
		const input = {
			recipient_name: "J",
			street: "12",
			city: "J",
			province: "D",
			postal_code: "123",
		};

		const result = userAddressInputCheck(input);

		expect(Object.keys(result).length).toBeGreaterThan(1);
	});
});
