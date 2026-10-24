-- V1: core schema for AUTH-02, CATALOG-01, CART-01, CHECKOUT-01

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(32)  NOT NULL DEFAULT 'CUSTOMER',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id            BIGSERIAL PRIMARY KEY,
    sku           VARCHAR(64)  NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT         NOT NULL DEFAULT '',
    category      VARCHAR(64)  NOT NULL,
    price_cents   INTEGER      NOT NULL CHECK (price_cents >= 0),
    image_url     VARCHAR(512) NOT NULL DEFAULT '',
    stock         INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_name     ON products (LOWER(name));

CREATE TABLE carts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id         BIGSERIAL PRIMARY KEY,
    cart_id    BIGINT  NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    product_id BIGINT  NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);

CREATE TABLE orders (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    order_number     VARCHAR(32)  NOT NULL UNIQUE,
    status           VARCHAR(32)  NOT NULL,
    total_cents      INTEGER      NOT NULL CHECK (total_cents >= 0),
    shipping_name    VARCHAR(255) NOT NULL,
    shipping_address VARCHAR(512) NOT NULL,
    placed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders (user_id);

CREATE TABLE order_items (
    id                 BIGSERIAL PRIMARY KEY,
    order_id           BIGINT       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id         BIGINT       NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    product_name       VARCHAR(255) NOT NULL,
    unit_price_cents   INTEGER      NOT NULL CHECK (unit_price_cents >= 0),
    quantity           INTEGER      NOT NULL CHECK (quantity > 0)
);
