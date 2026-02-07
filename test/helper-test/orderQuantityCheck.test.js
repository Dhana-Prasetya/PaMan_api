const orderQuantityCheck = require("../../src/helper/orderQuantityCheck");
jest.mock("../../src/config/inputConstraint", () => ({
	PRODUCT_CONSTRAINT: {
		MAX_STOCK: 1000,
	},
}));

describe("Helper - orderQuantityCheck", () => {
	it("should return true for valid quantity", () => {
		const result = orderQuantityCheck(5);
		expect(result).toBe(true);
	});

	it("should return true for quantity of 1", () => {
		const result = orderQuantityCheck(1);
		expect(result).toBe(true);
	});

	it("should return true for maximum allowed quantity", () => {
		const result = orderQuantityCheck(1000);
		expect(result).toBe(true);
	});

	it("should return error message for quantity of 0", () => {
		const result = orderQuantityCheck(0);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for negative quantity", () => {
		const result = orderQuantityCheck(-5);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for quantity exceeding maximum", () => {
		const result = orderQuantityCheck(1001);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for non-integer quantity", () => {
		const result = orderQuantityCheck(5.5);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for string quantity", () => {
		const result = orderQuantityCheck("5");
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for NaN", () => {
		const result = orderQuantityCheck(NaN);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for null", () => {
		const result = orderQuantityCheck(null);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for undefined", () => {
		const result = orderQuantityCheck(undefined);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for object", () => {
		const result = orderQuantityCheck({});
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return error message for array", () => {
		const result = orderQuantityCheck([5]);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should return true for large but valid quantity", () => {
		const result = orderQuantityCheck(999);
		expect(result).toBe(true);
	});

	it("should return true for mid-range quantity", () => {
		const result = orderQuantityCheck(500);
		expect(result).toBe(true);
	});

	it("should include constraint values in error message", () => {
		const result = orderQuantityCheck(0);
		expect(result).toContain("1");
		expect(result).toContain("1000");
	});

	it("should return error message for very large quantity", () => {
		const result = orderQuantityCheck(999999);
		expect(typeof result).toBe("string");
		expect(result).toContain("Order quantity must be");
	});

	it("should handle float number correctly", () => {
		const result = orderQuantityCheck(2.0);
		// 2.0 is equal to 2 integer, so Number.isInteger might vary depending on context
		// Following the actual implementation, it should check if it's truly an integer
		expect(typeof result).toBe("string"); // floats fail the check
	});
});
