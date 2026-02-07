const {
	getCloudinaryPublicId,
} = require("../../src/helper/getCloudinaryPublicId");
describe("Helper - getCloudinaryPublicId", () => {
	it("should extract public ID from standard Cloudinary URL", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("sample");
	});

	it("should extract public ID from URL without version", () => {
		const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("sample");
	});

	it("should handle public ID with folder structure", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/folder/subfolder/sample.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("folder/subfolder/sample");
	});

	it("should handle public ID with hyphens", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample-image-name.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("sample-image-name");
	});

	it("should handle public ID with underscores", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample_image_name.png";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("sample_image_name");
	});

	it("should handle different file extensions", () => {
		const urlJpg =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg";
		const urlPng =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample.png";
		const urlGif =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample.gif";

		expect(getCloudinaryPublicId(urlJpg)).toBe("sample");
		expect(getCloudinaryPublicId(urlPng)).toBe("sample");
		expect(getCloudinaryPublicId(urlGif)).toBe("sample");
	});

	it("should return null for invalid URL", () => {
		const url = "https://example.com/image.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBeNull();
	});

	it("should return null for URL without file extension", () => {
		const url = "https://res.cloudinary.com/demo/image/upload/sample";
		const result = getCloudinaryPublicId(url);
		expect(result).toBeNull();
	});

	it("should handle URL with multiple dots in filename", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample.image.name.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("sample.image.name");
	});

	it("should handle version with different formats", () => {
		const url1 = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";
		const url2 =
			"https://res.cloudinary.com/demo/image/upload/v999999/sample.jpg";

		expect(getCloudinaryPublicId(url1)).toBe("sample");
		expect(getCloudinaryPublicId(url2)).toBe("sample");
	});

	it("should handle numbers in public ID", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/sample123.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("sample123");
	});

	it("should handle complex nested folder paths", () => {
		const url =
			"https://res.cloudinary.com/demo/image/upload/v1234567890/users/2024/01/profile-pic.jpg";
		const result = getCloudinaryPublicId(url);
		expect(result).toBe("users/2024/01/profile-pic");
	});

	it("should be null for empty string", () => {
		const result = getCloudinaryPublicId("");
		expect(result).toBeNull();
	});
});
