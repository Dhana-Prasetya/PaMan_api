const removeNullProperties = require("../../src/helper/removeNullProperties");
describe("Helper - removeNullProperties", () => {
	it("should remove null properties from object", () => {
		const input = { a: 1, b: null, c: 3 };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: 1, c: 3 });
		expect(result.b).toBeUndefined();
	});

	it("should remove undefined properties from object", () => {
		const input = { a: 1, b: undefined, c: 3 };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: 1, c: 3 });
		expect(result.b).toBeUndefined();
	});

	it("should keep all properties if none are null or undefined", () => {
		const input = { a: 1, b: 2, c: 3 };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});

	it("should return empty object if all properties are null", () => {
		const input = { a: null, b: null, c: null };
		const result = removeNullProperties(input);

		expect(result).toEqual({});
	});

	it("should handle empty object", () => {
		const input = {};
		const result = removeNullProperties(input);

		expect(result).toEqual({});
	});

	it("should keep falsy values that are not null or undefined", () => {
		const input = { a: 0, b: false, c: "", d: null, e: undefined };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: 0, b: false, c: "" });
	});

	it("should keep zero values", () => {
		const input = { count: 0, total: 100 };
		const result = removeNullProperties(input);

		expect(result).toEqual({ count: 0, total: 100 });
	});

	it("should keep false values", () => {
		const input = { isActive: false, isDeleted: true };
		const result = removeNullProperties(input);

		expect(result).toEqual({ isActive: false, isDeleted: true });
	});

	it("should keep empty strings", () => {
		const input = { name: "", email: "test@example.com" };
		const result = removeNullProperties(input);

		expect(result).toEqual({ name: "", email: "test@example.com" });
	});

	it("should handle nested objects (shallow copy)", () => {
		const nested = { inner: 1 };
		const input = { a: nested, b: null };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: nested });
		expect(result.a).toBe(nested); // Same reference
	});

	it("should handle arrays as values", () => {
		const input = { a: [1, 2, 3], b: null, c: [] };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: [1, 2, 3], c: [] });
	});

	it("should not mutate the original object", () => {
		const input = { a: 1, b: null, c: 3 };
		const original = { a: 1, b: null, c: 3 };

		removeNullProperties(input);

		expect(input).toEqual(original);
	});

	it("should handle mixed data types", () => {
		const input = {
			string: "hello",
			number: 42,
			boolean: true,
			null: null,
			undefined: undefined,
			array: [1, 2],
			object: { key: "value" },
		};

		const result = removeNullProperties(input);

		expect(result).toEqual({
			string: "hello",
			number: 42,
			boolean: true,
			array: [1, 2],
			object: { key: "value" },
		});
	});

	it("should handle numeric zero", () => {
		const input = { a: 0, b: null };
		const result = removeNullProperties(input);

		expect(result).toEqual({ a: 0 });
		expect(result.a).toBe(0);
	});

	it("should handle NaN", () => {
		const input = { a: NaN, b: null };
		const result = removeNullProperties(input);

		expect(result).toHaveProperty("a");
		expect(isNaN(result.a)).toBe(true);
	});

	it("should preserve object property order", () => {
		const input = { z: 1, a: null, m: 3, b: null };
		const result = removeNullProperties(input);

		expect(Object.keys(result)).toEqual(["z", "m"]);
	});
});
