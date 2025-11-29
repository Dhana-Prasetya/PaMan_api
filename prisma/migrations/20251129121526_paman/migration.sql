-- CreateEnum
CREATE TYPE "gender_input" AS ENUM ('Laki', 'Perempuan', 'Rahasia');

-- CreateEnum
CREATE TYPE "order_status_input" AS ENUM ('Belum Bayar', 'Dikemas', 'Dikirim', 'Selesai');

-- CreateEnum
CREATE TYPE "payment_method_input" AS ENUM ('COD', 'Midtrans');

-- CreateEnum
CREATE TYPE "payment_status_input" AS ENUM ('Sukses', 'Proses', 'Gagal');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "gender" "gender_input" NOT NULL,
    "role" VARCHAR(10) DEFAULT 'user',
    "avatar_url" VARCHAR(255),
    "register_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" SERIAL NOT NULL,
    "carts_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordered_item" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_order" INTEGER NOT NULL,

    CONSTRAINT "ordered_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "order_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "total_price" INTEGER NOT NULL,
    "order_status" "order_status_input" NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" INTEGER NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "payment_method" "payment_method_input" NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "payment_status" "payment_status_input" NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_review" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "review" TEXT,
    "rating" INTEGER,

    CONSTRAINT "product_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "stock" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "photo_url" VARCHAR(255),
    "description" TEXT,
    "total_reviews" INTEGER DEFAULT 0,
    "average_rating" DECIMAL(2,1) DEFAULT 0.0,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_address" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "kecamatan" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "province" VARCHAR(255) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,

    CONSTRAINT "user_address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_phone_number_email_key" ON "users"("username", "phone_number", "email");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_carts_id_product_id_key" ON "cart_item"("carts_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "ordered_item_order_id_product_id_key" ON "ordered_item"("order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_review_user_id_product_id_key" ON "product_review"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_carts_id_fkey" FOREIGN KEY ("carts_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordered_item" ADD CONSTRAINT "ordered_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ordered_item" ADD CONSTRAINT "ordered_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_address" ADD CONSTRAINT "user_address_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
