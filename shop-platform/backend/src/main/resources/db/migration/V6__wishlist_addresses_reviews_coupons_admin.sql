-- Adds the five remaining journey domains: wishlist, addresses, reviews, coupons,
-- and the admin-managed product flag.

CREATE TABLE wishlist_items (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id  BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);
CREATE INDEX idx_wishlist_user ON wishlist_items (user_id);

CREATE TABLE addresses (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    label       VARCHAR(64) NOT NULL,
    recipient   VARCHAR(128) NOT NULL,
    line1       VARCHAR(255) NOT NULL,
    city        VARCHAR(128) NOT NULL,
    state       VARCHAR(128) NOT NULL,
    postal_code VARCHAR(16)  NOT NULL,
    is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses (user_id);

CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating      INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(1000) NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- One review per shopper per product; a second submission updates the first.
    CONSTRAINT uq_review_user_product UNIQUE (user_id, product_id)
);
CREATE INDEX idx_reviews_product ON reviews (product_id);

CREATE TABLE coupons (
    id                   BIGSERIAL PRIMARY KEY,
    code                 VARCHAR(32) NOT NULL UNIQUE,
    description          VARCHAR(255) NOT NULL DEFAULT '',
    percent_off          INT         NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
    min_order_paise      INT         NOT NULL DEFAULT 0,
    active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE carts ADD COLUMN coupon_code VARCHAR(32);

ALTER TABLE products ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO coupons (code, description, percent_off, min_order_paise, active) VALUES
    ('SAVE10',   '10% off orders over Rs 5,000',  10,  500000, TRUE),
    ('SAVE25',   '25% off orders over Rs 50,000', 25, 5000000, TRUE),
    ('EXPIRED',  'No longer available',           50,       0, FALSE);
