const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function pagination({ page, limit, table }) {
	const skip = (page - 1) * limit; // Calculate the number of records to skip based of page and limit

	const total = await prisma[table].count(); // Modularize table name for counting total records
	const totalPages = Math.ceil(total / limit);

	return { skip, total, totalPages };
}

module.exports = pagination;
