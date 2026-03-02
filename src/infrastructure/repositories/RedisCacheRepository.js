class RedisCacheRepository {
	constructor(redisClient) {
		this.client = redisClient;
	}

	async save(key, value, ttl) {
		await this.client.setEx(key, ttl, value.toString());
	}

	async get(key) {
		const data = await this.client.get(key);
		return data;
	}

	async delete(key) {
		const data = await this.client.del(key);
	}
}

module.exports = RedisCacheRepository;
