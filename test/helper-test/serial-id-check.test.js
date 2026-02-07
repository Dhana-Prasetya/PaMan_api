const serialIdCheck = require("../../src/helper/serial-id-check");
jest.mock("../../src/config/inputConstraint", () => ({
	ID_CONSTRAINT: {
		MIN_INT: 1,
		MAX_INT: 2147483647,
	},
}));

describe("Helper - serialIdCheck", () => {
	it("should return true for valid ID", () => {
		const result = serialIdCheck(1);
		expect(result).toBe(true);
	});

	it("should return true for minimum valid ID", () => {
		const result = serialIdCheck(1);
		expect(result).toBe(true);
	});

	it("should return true for maximum valid ID", () => {
		const result = serialIdCheck(2147483647);
		expect(result).toBe(true);
	});

	it("should return true for ID in middle range", () => {
		const result = serialIdCheck(1000);
		expect(result).toBe(true);
	});

	it("should return error message for ID of 0", () => {
		const result = serialIdCheck(0);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for negative ID", () => {
		const result = serialIdCheck(-5);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for ID exceeding maximum", () => {
		const result = serialIdCheck(2147483648);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for decimal ID", () => {
		const result = serialIdCheck(5.5);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for string ID", () => {
		const result = serialIdCheck("5");
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for NaN", () => {
		const result = serialIdCheck(NaN);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for null", () => {
		const result = serialIdCheck(null);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error message for undefined", () => {
		const result = serialIdCheck(undefined);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should include constraint values in error message", () => {
		const result = serialIdCheck(0);
		expect(result).toContain("1");
		expect(result).toContain("2147483647");
	});

	it("should return error for very large negative number", () => {
		const result = serialIdCheck(-2147483648);
		expect(typeof result).toBe("string");
	});

	it("should return true for large valid ID", () => {
		const result = serialIdCheck(999999999);
		expect(result).toBe(true);
	});

	it("should return error for object", () => {
		const result = serialIdCheck({});
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return error for array", () => {
		const result = serialIdCheck([5]);
		expect(typeof result).toBe("string");
		expect(result).toContain("ID must be a integer");
	});

	it("should return true for 100", () => {
		const result = serialIdCheck(100);
		expect(result).toBe(true);
	});

	it("should return true for 999999", () => {
		const result = serialIdCheck(999999);
		expect(result).toBe(true);
	});
});
