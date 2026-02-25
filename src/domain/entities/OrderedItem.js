class OrderedItem {
	constructor({ id, order_id, product_id, quantity, price_at_order }) {
		this.id = id;
		this.order_id = order_id;
		this.product_id = product_id;
		this.quantity = quantity;
		this.price_at_order = price_at_order;
	}
}

module.exports = OrderedItem;
