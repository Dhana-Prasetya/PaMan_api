class Order {
	constructor({ id, user_id, total_price, order_status, destination }) {
		this.id = id;
		this.user_id = user_id;
		this.total_price = total_price;
		this.order_status = order_status;
		this.destination = destination;
	}
}

module.exports = Order;
