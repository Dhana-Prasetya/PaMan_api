class UserAddress {
	constructor({
		id,
		user_id,
		recipient_name,
		street,
		kecamatan,
		city,
		province,
		postal_code,
		detail,
	}) {
		this.id = id;
		this.user_id = user_id;
		this.recipient_name = recipient_name;
		this.street = street;
		this.kecamatan = kecamatan;
		this.city = city;
		this.province = province;
		this.postal_code = postal_code;
		this.detail = detail;
	}
}

module.exports = UserAddress;
