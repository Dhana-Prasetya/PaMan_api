class HelpfulReview {
	constructor({ id, review_id, user_id, helpful }) {
		this.id = id;
		this.review_id = review_id;
		this.user_id = user_id;
		this.helpful = helpful;
	}
}

module.exports = HelpfulReview;
