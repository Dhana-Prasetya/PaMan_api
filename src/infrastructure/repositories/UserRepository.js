const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class UserRepository {
	async findByEmail(email) {
		return await prisma.users.findUnique({ where: { email } });
	}
	async findByUsername(username) {
		return await prisma.users.findUnique({ where: { username } });
	}
	async save(userEntity) {
		return await prisma.users.create({ data: userEntity });
	}
}

module.exports = UserRepository;
