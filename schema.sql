-- PGsql Schema

-- Extension & enum
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For native uuid
CREATE TYPE gender_enum AS ENUM ('Laki', 'Perempuan', 'Rahasia'); -- Constant choice for biological gender
CREATE TYPE order_status_enum AS ENUM ('Belum Bayar', 'Dikemas', 'Dikirim', 'Selesai', 'Diterima'); -- Constant choice for order status
CREATE TYPE payment_method_enum AS ENUM ('COD', 'Midtrans'); -- Constant choice for payment method
CREATE TYPE payment_status_enum AS ENUM ('Sukses', 'Proses', 'Gagal'); -- Constant choice for payment status
CREATE TYPE product_category_enum AS ENUM ('Beras', 'Sayur', 'Buah'); -- Constant choice for product category

-- Independent table

CREATE TABLE users (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	username VARCHAR(20) unique,
	full_name varchar(255) not null,
	phone_number varchar(20) NOT NULL unique,
	email VARCHAR(255) NOT NULL unique,
	password VARCHAR(255),
	gender gender_enum NOT NULL,
	role VARCHAR(10) not null, -- Contain 'user' and 'admin' role
	birthday date,
	avatar_url varchar(255),
	register_date timestamp with time zone default now()
);

CREATE TABLE admin (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	username VARCHAR(255) NOT null unique,
	email VARCHAR(255) NOT NULL unique,
	password VARCHAR(255) NOT NULL,
	role VARCHAR(10) not null, -- Contain 'user' and 'admin' role
	avatar_url varchar(255),
	register_date timestamp with time zone default now()
);

CREATE TABLE products(
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) not null unique,
	stock INT not null CHECK (stock >= 0),
	price INT not null CHECK (price >= 0),
	photo_url varchar(255) not null,
	description varchar(4000) not null,
	category product_category_enum NOT NULL,
	discounted_price INT CHECK (discounted_price >= 0),
	sold int default 0 CHECK (sold >= 0) not null,
	total_reviews int default 0 CHECK (total_reviews >= 0),
	average_rating NUMERIC(2, 1) DEFAULT 0.0
);

Create table contact (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	username VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	message varchar(800) not null
);

-- Dependant table

create table user_address(
	id serial primary key,
	user_id uuid not null REFERENCES users(id) ON DELETE cascade,
	recipient_name varchar(50) not null,
	street VARCHAR(255) NOT NULL,
	kecamatan VARCHAR(255) NOT NULL,
	city VARCHAR(100) NOT NULL,
	province VARCHAR(100) NOT NULL,
	postal_code VARCHAR(5) NOT null,
	detail varchar(255),
is_default boolean default false -- Default flag
);

-- ENFORCEMENT: Index to ensure only ONE address is the default (TRUE) per user
CREATE UNIQUE INDEX one_default_per_user ON user_address (user_id)
WHERE is_default = TRUE;

CREATE table orders(
	id SERIAL PRIMARY KEY,
	user_id uuid not null REFERENCES users(id) ON DELETE RESTRICT,
	order_date timestamp with time zone default now(),
	total_price INT not null CHECK (total_price >= 0),
	order_status order_status_enum not null,
	destination int not null REFERENCES user_address(id)
);

CREATE SEQUENCE payment_cash_seq;

CREATE TABLE payments(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id int not null REFERENCES orders(id) ON DELETE RESTRICT,
    transaction_id VARCHAR(255) NOT NULL UNIQUE  -- Accept both COD and payment gateway
        DEFAULT ('COD' || nextval('payment_cash_seq')::text),
    payment_method payment_method_enum not null,
    amount_paid int not null CHECK (amount_paid >= 0),
    amount_to_pay int not null CHECK (amount_paid >= 0),
    payment_status payment_status_enum not null,
    created_at timestamp with time zone default now()
);

CREATE TABLE ordered_item(
	id SERIAL PRIMARY KEY,
	order_id int not null REFERENCES orders(id) ON DELETE CASCADE,
	product_id int not null REFERENCES products(id) ON DELETE RESTRICT, -- Need more advance delete logic for flexibility, e.g. only can delete after order_status is completed
	quantity INT not null CHECK (quantity > 0),
	price_at_order INT NOT null CHECK (price_at_order >= 0),
	UNIQUE (order_id, product_id) -- ensures a product is only listed once per order (composite unique constraint) 
);

create table carts(
	id serial primary key,
	user_id uuid not null unique REFERENCES users(id) ON DELETE cascade
);

create table carts_items(
	id serial primary key,
	cart_id int not null REFERENCES carts(id) ON DELETE CASCADE,
	product_id int not null REFERENCES products(id) ON DELETE RESTRICT,
	quantity int not null CHECK (quantity > 0),
	UNIQUE (cart_id, product_id)
);

Create table product_review (
	id SERIAL PRIMARY KEY,
	product_id int not null REFERENCES products(id) ON DELETE RESTRICT,
	user_id uuid not null REFERENCES users(id) ON DELETE RESTRICT,
	review varchar(4000),
	rating INT not null CHECK (rating >= 1 AND rating <= 5), 
	helpful int not null default 0,
	UNIQUE (user_id, product_id)
);

Create table helpful_review (
	id SERIAL PRIMARY KEY,
	review_id int not null REFERENCES product_review(id) ON DELETE RESTRICT,
	user_id uuid not null REFERENCES users(id) ON DELETE RESTRICT,
	helpful int check (helpful >= -1 and helpful <= 1),
unique(review_id, user_id)
);



-- Rating calculation function and trigger

CREATE OR REPLACE FUNCTION update_product_rating_cache()
RETURNS TRIGGER AS $$
BEGIN

	UPDATE products P
	SET
		total_reviews = (
			SELECT COUNT(R.id)
			FROM product_review R
			WHERE R.product_id = NEW.product_id
		),
		average_rating = (
			SELECT COALESCE(AVG(R.rating), 0)
			FROM product_review R
			WHERE R.product_id = NEW.product_id
		)
	WHERE P.id = NEW.product_id;
	
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_review
FOR EACH ROW
EXECUTE FUNCTION update_product_rating_cache();


-- Rating helpful function and trigger

CREATE OR REPLACE FUNCTION sync_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id INT;
BEGIN
    -- Determine which review_id needs updating
    -- If deleting, we use OLD; otherwise we use NEW
    IF (TG_OP = 'DELETE') THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;

    -- Update the product_review table with the sum of helpful votes
    UPDATE product_review
    SET helpful = (
        SELECT COALESCE(SUM(helpful), 0)
        FROM helpful_review
        WHERE review_id = target_review_id
    )
    WHERE id = target_review_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helpful_score
AFTER INSERT OR UPDATE OR DELETE ON helpful_review
FOR EACH ROW
EXECUTE FUNCTION sync_helpful_count();