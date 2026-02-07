const { response } = require("../../src/helper/common");
describe("Helper - response", () => {
	let mockRes;

	beforeEach(() => {
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
	});

	it("should send response with success status", () => {
		const result = { id: 1, name: "Test" };
		const status = 200;
		const message = "Success";

		response(mockRes, result, status, message);

		expect(mockRes.status).toHaveBeenCalledWith(status);
		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: status,
			data: result,
			message: message,
		});
	});

	it("should handle null data", () => {
		const status = 200;
		const message = "Success";

		response(mockRes, null, status, message);

		expect(mockRes.status).toHaveBeenCalledWith(status);
		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: status,
			data: null,
			message: message,
		});
	});

	it("should handle empty array as data", () => {
		const result = [];
		const status = 200;
		const message = "No data found";

		response(mockRes, result, status, message);

		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: status,
			data: [],
			message: message,
		});
	});

	it("should handle message as null", () => {
		const result = { id: 1 };
		const status = 201;

		response(mockRes, result, status);

		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: status,
			data: result,
			message: null,
		});
	});

	it("should handle 4xx status codes", () => {
		const result = null;
		const status = 404;
		const message = "Not Found";

		response(mockRes, result, status, message);

		expect(mockRes.status).toHaveBeenCalledWith(404);
		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: 404,
			data: null,
			message: "Not Found",
		});
	});

	it("should handle 5xx status codes", () => {
		const result = null;
		const status = 500;
		const message = "Internal Server Error";

		response(mockRes, result, status, message);

		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: 500,
			data: null,
			message: "Internal Server Error",
		});
	});

	it("should handle complex nested objects as data", () => {
		const result = {
			user: { id: 1, name: "John" },
			orders: [
				{ id: 1, total: 100 },
				{ id: 2, total: 200 },
			],
		};
		const status = 200;
		const message = "Complex data";

		response(mockRes, result, status, message);

		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: 200,
			data: result,
			message: "Complex data",
		});
	});

	it("should handle boolean values in message", () => {
		const result = { success: true };
		const status = 200;
		const message = null;

		response(mockRes, result, status, message);

		expect(mockRes.json).toHaveBeenCalledWith({
			status: "Success",
			statusCode: 200,
			data: result,
			message: null,
		});
	});

	it("should chain status and json methods correctly", () => {
		const result = { test: true };
		const status = 200;

		response(mockRes, result, status, "Test message");

		expect(mockRes.status).toHaveBeenCalledBefore(mockRes.json);
	});
});
