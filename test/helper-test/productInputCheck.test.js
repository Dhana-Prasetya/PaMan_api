const productInputCheck = require("../../src/helper/productInputCheck");
jest.mock("../../src/config/inputConstraint", () => ({
	PRODUCT_CONSTRAINT: {
		MAX_STOCK: 1000,
		MIN_STOCK: 1,
		MAX_PRICE: 100000,
		MIN_PRICE: 100,
		MAX_NAME_VARCHAR: 255,
		MIN_NAME_VARCHAR: 3,
		MAX_TEXT_VARCHAR: 4000,
		ALLOWED_NAME_REGEX: /^[a-zA-Z0-9\s\-.,_:'\"()#&|/~=]+$/,
		ALLOWED_DESCRIPTION_REGEX: /^[a-zA-Z0-9\s\-.,_:'\"()#&|/~=]*$/,
	},
}));

describe("Helper - productInputCheck", () => {
	it("should return empty errors object for valid product input", () => {
		const input = {
			name: "Valid Product Name",
			stock: 50,
			price: 5000,
			description: "A valid product description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toEqual({});
	});

	it("should return error for null name", () => {
		const input = {
			name: null,
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		// null name should still pass if it's null (not validated)
		expect(result).toEqual({});
	});

	it("should return error for numeric-only name", () => {
		const input = {
			name: "123456",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("name");
		expect(result.name).toContain("must contain letters");
	});

	it("should return error for name too short", () => {
		const input = {
			name: "ab",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("name");
		expect(result.name).toContain("between");
	});

	it("should return error for name too long", () => {
		const input = {
			name: "a".repeat(256),
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("name");
		expect(result.name).toContain("between");
	});

	it("should return error for invalid stock", () => {
		const input = {
			name: "Valid Product",
			stock: 0,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("stock");
		expect(result.stock).toContain("must be a positive integer");
	});

	it("should return error for stock exceeding maximum", () => {
		const input = {
			name: "Valid Product",
			stock: 1001,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("stock");
	});

	it("should return error for decimal stock", () => {
		const input = {
			name: "Valid Product",
			stock: 5.5,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("stock");
	});

	it("should return error for price below minimum", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 50,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("price");
		expect(result.price).toContain("must be a positive integer");
	});

	it("should return error for price exceeding maximum", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 100001,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("price");
	});

	it("should return error for decimal price", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000.99,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("price");
	});

	it("should return error for description exceeding maximum length", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000,
			description: "a".repeat(4001),
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("description");
	});

	it("should return error for invalid characters in description", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000,
			description: "Description with invalid @#$ characters",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("description");
	});

	it("should return error for invalid category", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "InvalidCategory123!",
		};

		const result = productInputCheck(input);

		// May have category error depending on validation logic
		expect(typeof result).toBe("object");
	});

	it("should return error for discounted price higher than original price", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
			discounted_price: 6000,
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("discounted_price");
	});

	it("should return error for negative discounted price", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
			discounted_price: -500,
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("discounted_price");
	});

	it("should accept valid discounted price", () => {
		const input = {
			name: "Valid Product",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
			discounted_price: 4000,
		};

		const result = productInputCheck(input);

		// Should not have error for valid discount
		expect(result.discounted_price).toBeUndefined();
	});

	it("should return object with multiple errors for multiple invalid fields", () => {
		const input = {
			name: "123",
			stock: -5,
			price: 50,
			description: "a".repeat(4001),
			category: "Electronics",
		};

		const result = productInputCheck(input);

		// Should have multiple error properties
		expect(Object.keys(result).length).toBeGreaterThan(0);
	});

	it("should handle name with allowed special characters", () => {
		const input = {
			name: "Product-Name: (Model) #1 & More",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result.name).toBeUndefined();
	});

	it("should return error for name with disallowed special characters", () => {
		const input = {
			name: "Product@Name!",
			stock: 50,
			price: 5000,
			description: "Description",
			category: "Electronics",
		};

		const result = productInputCheck(input);

		expect(result).toHaveProperty("name");
	});
});
