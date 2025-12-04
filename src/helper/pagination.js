const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function pagination({ page, limit }) {
	const skip = (page - 1) * limit; // Calculate the number of records to skip based of page and limit

	const total = await prisma.products.count();
	const totalPages = Math.ceil(total / limit);

	return { skip, total, totalPages };
}

module.exports = pagination;
