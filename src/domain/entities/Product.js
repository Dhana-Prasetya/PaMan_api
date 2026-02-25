class Product {
	constructor({
		id,
		name,
		stock,
		price,
		photo_url,
		description,
		category,
		discounted_price,
	}) {
		this.id = id;
		this.name = name;
		this.stock = stock;
		this.price = price;
		this.photo_url = photo_url;
		this.description = description;
		this.category = category;
		this.discounted_price = discounted_price;
	}
}

module.exports = Product;
