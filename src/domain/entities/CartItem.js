class CartItem {
	constructor({ id, cart_id, product_id, quantity }) {
		this.id = id;
		this.cart_id = cart_id;
		this.product_id = product_id;
		this.quantity = quantity;
	}
}

module.exports = CartItem;
