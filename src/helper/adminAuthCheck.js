const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function adminIdCheck(admin_id) {
	const adminInDb = await prisma.admin.findUnique({
		where: {
			id: admin_id,
		},
	});

	if (!adminInDb) {
		return false;
	} else {
		return true;
	}
}

module.exports = adminIdCheck;
