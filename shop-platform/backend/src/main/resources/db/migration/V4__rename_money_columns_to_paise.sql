-- V4: money columns hold paise (1 INR = 100 paise), so name them accordingly.
-- "cents" was inherited from the original GBP seed data and is now misleading.

ALTER TABLE products    RENAME COLUMN price_cents      TO price_paise;
ALTER TABLE orders      RENAME COLUMN total_cents      TO total_paise;
ALTER TABLE order_items RENAME COLUMN unit_price_cents TO unit_price_paise;
