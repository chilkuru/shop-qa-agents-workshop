-- V3: switch catalog pricing to INR and point at the bundled SVG artwork.
-- price_cents holds the minor unit for the active currency (paise for INR).
-- A new migration rather than editing V2: Flyway validates checksums of applied migrations.

UPDATE products SET price_cents = 4990000, image_url = '/img/espresso-machine.svg' WHERE sku = 'SKU-ESP-001';
UPDATE products SET price_cents = 1890000, image_url = '/img/burr-grinder.svg'     WHERE sku = 'SKU-GRD-002';
UPDATE products SET price_cents =  450000, image_url = '/img/gooseneck-kettle.svg' WHERE sku = 'SKU-KTL-003';
UPDATE products SET price_cents = 2490000, image_url = '/img/headphones.svg'       WHERE sku = 'SKU-HDP-004';
UPDATE products SET price_cents = 3990000, image_url = '/img/speakers.svg'         WHERE sku = 'SKU-SPK-005';
UPDATE products SET price_cents = 1290000, image_url = '/img/microphone.svg'       WHERE sku = 'SKU-MIC-006';
UPDATE products SET price_cents = 3490000, image_url = '/img/chair.svg'            WHERE sku = 'SKU-CHR-007';
UPDATE products SET price_cents = 5990000, image_url = '/img/desk.svg'             WHERE sku = 'SKU-DSK-008';
UPDATE products SET price_cents =  299900, image_url = '/img/lamp.svg'             WHERE sku = 'SKU-LMP-009';
UPDATE products SET price_cents = 1490000, image_url = '/img/keyboard.svg'         WHERE sku = 'SKU-KEY-010';
UPDATE products SET price_cents =  349900, image_url = '/img/mouse.svg'            WHERE sku = 'SKU-MOU-011';
UPDATE products SET price_cents = 5490000, image_url = '/img/monitor.svg'          WHERE sku = 'SKU-MON-012';
