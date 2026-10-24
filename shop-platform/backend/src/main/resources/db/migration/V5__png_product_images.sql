-- V5: PNG artwork replaces SVG. React Native's <Image> cannot render SVG, so a raster
-- format lets web and mobile share the same asset with no extra native dependency.

UPDATE products SET image_url = REPLACE(image_url, '.svg', '.png') WHERE image_url LIKE '%.svg';
