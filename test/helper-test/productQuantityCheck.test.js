const productQuantityCheck = require("../../src/helper/productQuantityCheck");
jest.mock("../../src/config/inputConstraint", () => ({
	PRODUCT_CONSTRAINT: {
		MAX_STOCK: 1000,
		MIN_STOCK: 1,
	},
}));

describe("Helper - productQuantityCheck", () => {
	it("should return true for valid quantity", () => {
		const result = productQuantityCheck(5);
		expect(result).toBe(true);
	});

	it("should return true for minimum valid quantity", () => {
		const result = productQuantityCheck(1);
		expect(result).toBe(true);
	});

	it("should return true for maximum valid quantity", () => {
		const result = productQuantityCheck(1000);
		expect(result).toBe(true);
	});

	it("should return error message for quantity of 0", () => {
		const result = productQuantityCheck(0);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for negative quantity", () => {
		const result = productQuantityCheck(-5);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for quantity exceeding maximum", () => {
		const result = productQuantityCheck(1001);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for decimal quantity", () => {
		const result = productQuantityCheck(5.5);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for string quantity", () => {
		const result = productQuantityCheck("5");
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for NaN", () => {
		const result = productQuantityCheck(NaN);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for null", () => {
		const result = productQuantityCheck(null);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return error message for undefined", () => {
		const result = productQuantityCheck(undefined);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should return true for mid-range quantity", () => {
		const result = productQuantityCheck(500);
		expect(result).toBe(true);
	});

	it("should include min and max values in error message", () => {
		const result = productQuantityCheck(0);
		expect(result).toContain("1");
		expect(result).toContain("1000");
	});

	it("should return error message for very large quantity", () => {
		const result = productQuantityCheck(999999);
		expect(typeof result).toBe("string");
		expect(result).toContain("Product quantity must be");
	});

	it("should handle edge case just below minimum", () => {
		const result = productQuantityCheck(0);
		expect(typeof result).toBe("string");
	});

	it("should handle edge case just above maximum", () => {
		const result = productQuantityCheck(1001);
		expect(typeof result).toBe("string");
	});

	it("should return true for 100", () => {
		const result = productQuantityCheck(100);
		expect(result).toBe(true);
	});

	it("should return true for 999", () => {
		const result = productQuantityCheck(999);
		expect(result).toBe(true);
	});
});
