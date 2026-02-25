class Payment {
	constructor({
		id,
		order_id,
		transaction_id,
		payment_method,
		amount_paid,
		amount_to_pay,
		payment_status,
	}) {
		this.id = id;
		this.order_id = order_id;
		this.transaction_id = transaction_id;
		this.payment_method = payment_method;
		this.amount_paid = amount_paid;
		this.amount_to_pay = amount_to_pay;
		this.payment_status = payment_status;
	}
}

module.exports = Payment;
