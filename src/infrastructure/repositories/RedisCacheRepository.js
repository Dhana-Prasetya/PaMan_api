class RedisCacheRepository {
	constructor(redisClient) {
		this.client = redisClient;
	}

	async save(key, value, ttl) {
		await this.client.set(key, value.toString(), "EX", ttl);
	}

	async get(key) {
		const data = await this.client.get(key);
		return data;
	}
}

module.exports = RedisCacheRepository;
