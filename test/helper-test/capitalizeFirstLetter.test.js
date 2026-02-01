const capitalizeFirstLetter = require("../../src/helper/capitalizeFirstLetter");
describe("Helper - capitalizeFirstLetter", () => {
	it("should capitalize the first letter of a string", () => {
		const result = capitalizeFirstLetter("hello");
		expect(result).toBe("Hello");
	});

	it("should handle strings that are already capitalized", () => {
		const result = capitalizeFirstLetter("Hello");
		expect(result).toBe("Hello");
	});

	it("should handle single character strings", () => {
		const result = capitalizeFirstLetter("a");
		expect(result).toBe("A");
	});

	it("should handle empty strings", () => {
		const result = capitalizeFirstLetter("");
		expect(result).toBe("");
	});

	it("should handle strings with numbers", () => {
		const result = capitalizeFirstLetter("123hello");
		expect(result).toBe("123hello");
	});

	it("should handle strings with special characters at the start", () => {
		const result = capitalizeFirstLetter("@hello");
		expect(result).toBe("@hello");
	});

	it("should return non-string inputs as-is", () => {
		expect(capitalizeFirstLetter(null)).toBe(null);
		expect(capitalizeFirstLetter(undefined)).toBe(undefined);
		expect(capitalizeFirstLetter(123)).toBe(123);
	});

	it("should handle strings with multiple words", () => {
		const result = capitalizeFirstLetter("hello world");
		expect(result).toBe("Hello world");
	});

	it("should handle strings with uppercase letters after the first", () => {
		const result = capitalizeFirstLetter("hELLO");
		expect(result).toBe("HELLO");
	});

	it("should handle whitespace at the start", () => {
		const result = capitalizeFirstLetter(" hello");
		expect(result).toBe(" hello");
	});
});
