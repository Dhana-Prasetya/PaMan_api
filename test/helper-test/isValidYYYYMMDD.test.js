const isValidYYYYMMDD = require("../../src/helper/isValidYYYYMMDD");
describe("Helper - isValidYYYYMMDD", () => {
	it("should return true for valid date string", () => {
		expect(isValidYYYYMMDD("2024-01-15")).toBe(true);
	});

	it("should return true for leap year February 29", () => {
		expect(isValidYYYYMMDD("2024-02-29")).toBe(true);
	});

	it("should return true for December 31", () => {
		expect(isValidYYYYMMDD("2024-12-31")).toBe(true);
	});

	it("should return true for January 1", () => {
		expect(isValidYYYYMMDD("2024-01-01")).toBe(true);
	});

	it("should return false for non-leap year February 29", () => {
		expect(isValidYYYYMMDD("2023-02-29")).toBe(false);
	});

	it("should return false for invalid month", () => {
		expect(isValidYYYYMMDD("2024-13-01")).toBe(false);
	});

	it("should return false for invalid day", () => {
		expect(isValidYYYYMMDD("2024-01-32")).toBe(false);
	});

	it("should return false for invalid February date", () => {
		expect(isValidYYYYMMDD("2023-02-30")).toBe(false);
	});

	it("should return false for April 31 (April has 30 days)", () => {
		expect(isValidYYYYMMDD("2024-04-31")).toBe(false);
	});

	it("should return false for September 31 (September has 30 days)", () => {
		expect(isValidYYYYMMDD("2024-09-31")).toBe(false);
	});

	it("should return false for invalid format without dashes", () => {
		expect(isValidYYYYMMDD("20240115")).toBe(false);
	});

	it("should return false for format with slashes", () => {
		expect(isValidYYYYMMDD("2024/01/15")).toBe(false);
	});

	it("should return false for format with wrong separator", () => {
		expect(isValidYYYYMMDD("2024-01_15")).toBe(false);
	});

	it("should return false for string with leading/trailing spaces", () => {
		expect(isValidYYYYMMDD(" 2024-01-15")).toBe(false);
		expect(isValidYYYYMMDD("2024-01-15 ")).toBe(false);
	});

	it("should return false for month with leading zero but invalid", () => {
		expect(isValidYYYYMMDD("2024-00-15")).toBe(false);
	});

	it("should return false for day with leading zero but invalid", () => {
		expect(isValidYYYYMMDD("2024-01-00")).toBe(false);
	});

	it("should return true for year 2000 (leap year)", () => {
		expect(isValidYYYYMMDD("2000-02-29")).toBe(true);
	});

	it("should return false for year 1900 (not a leap year)", () => {
		expect(isValidYYYYMMDD("1900-02-29")).toBe(false);
	});

	it("should return true for distant past date", () => {
		expect(isValidYYYYMMDD("1970-01-01")).toBe(true);
	});

	it("should return true for future date", () => {
		expect(isValidYYYYMMDD("2099-12-31")).toBe(true);
	});

	it("should return false for incomplete date string", () => {
		expect(isValidYYYYMMDD("2024-01")).toBe(false);
	});

	it("should return false for single month digit", () => {
		expect(isValidYYYYMMDD("2024-1-15")).toBe(false);
	});

	it("should return false for single day digit", () => {
		expect(isValidYYYYMMDD("2024-01-5")).toBe(false);
	});

	it("should return false for empty string", () => {
		expect(isValidYYYYMMDD("")).toBe(false);
	});

	it("should return false for null or undefined", () => {
		expect(isValidYYYYMMDD(null)).toBe(false);
		expect(isValidYYYYMMDD(undefined)).toBe(false);
	});

	it("should return false for alphabetic characters", () => {
		expect(isValidYYYYMMDD("abcd-ef-gh")).toBe(false);
	});

	it("should return false for mixed content", () => {
		expect(isValidYYYYMMDD("2024-01-1a")).toBe(false);
	});
});
