const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class UserRepository {
	async findByEmail(email) {
		return await prisma.users.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				password: true,
				role: true,
				username: true,
			},
		});
	}
	async findByUsername(username) {
		return await prisma.users.findUnique({ where: { username } });
	}
	async save(userEntity) {
		try {
			return await prisma.users.create({ data: userEntity });
		} catch (error) {
			if (error.code === "P2002") {
				// Prisma unique constraint violation code
				const error = new Error("A user with this email already exists");
				error.name = "UserAlreadyExistsError";
				throw error;
			} else {
				throw error;
			}
		}
	}
}

module.exports = UserRepository;
