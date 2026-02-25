class ProductReview {
	constructor({ id, product_id, user_id, review, rating, helpful }) {
		this.id = id;
		this.product_id = product_id;
		this.user_id = user_id;
		this.review = review;
		this.rating = rating;
		this.helpful = helpful || 0; // Default to 0 if not provided
	}
}

module.exports = ProductReview;
