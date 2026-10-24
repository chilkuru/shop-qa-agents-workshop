-- V2: baseline catalog. Deterministic ids/SKUs so test fixtures can rely on them.

INSERT INTO products (sku, name, description, category, price_cents, image_url, stock) VALUES
  ('SKU-ESP-001', 'Espresso Machine',   'Dual-boiler espresso machine with PID control.', 'Kitchen',     49900, '/img/espresso-machine.jpg', 25),
  ('SKU-GRD-002', 'Burr Grinder',       'Conical burr grinder with 40 grind settings.',   'Kitchen',     18900, '/img/burr-grinder.jpg',     40),
  ('SKU-KTL-003', 'Gooseneck Kettle',   'Variable temperature gooseneck kettle.',         'Kitchen',      8900, '/img/gooseneck-kettle.jpg', 60),
  ('SKU-HDP-004', 'Studio Headphones',  'Closed-back reference headphones.',              'Audio',       24900, '/img/headphones.jpg',       30),
  ('SKU-SPK-005', 'Bookshelf Speakers', 'Two-way bookshelf speakers, pair.',              'Audio',       39900, '/img/speakers.jpg',         15),
  ('SKU-MIC-006', 'USB Microphone',     'Cardioid USB condenser microphone.',             'Audio',       12900, '/img/microphone.jpg',       45),
  ('SKU-CHR-007', 'Ergonomic Chair',    'Mesh-back task chair with lumbar support.',      'Furniture',   34900, '/img/chair.jpg',            20),
  ('SKU-DSK-008', 'Standing Desk',      'Electric sit-stand desk, 140x70cm.',             'Furniture',   59900, '/img/desk.jpg',             12),
  ('SKU-LMP-009', 'Desk Lamp',          'Dimmable LED desk lamp with USB-C.',             'Furniture',    6900, '/img/lamp.jpg',             80),
  ('SKU-KEY-010', 'Mechanical Keyboard','Hot-swappable 75% mechanical keyboard.',         'Peripherals', 14900, '/img/keyboard.jpg',         50),
  ('SKU-MOU-011', 'Wireless Mouse',     'Low-latency wireless ergonomic mouse.',          'Peripherals',  7900, '/img/mouse.jpg',            70),
  ('SKU-MON-012', '4K Monitor',         '27-inch 4K IPS monitor with USB-C hub.',         'Peripherals', 54900, '/img/monitor.jpg',          18);
