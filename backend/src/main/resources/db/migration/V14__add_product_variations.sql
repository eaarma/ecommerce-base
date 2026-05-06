ALTER TABLE products
    RENAME COLUMN price TO base_price;

ALTER TABLE products
    RENAME COLUMN image_url TO main_image_url;

ALTER TABLE products
    ADD COLUMN slug VARCHAR(180);

UPDATE products
SET slug = CONCAT(
        TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))),
        '-',
        id
    )
WHERE slug IS NULL;

ALTER TABLE products
    ALTER COLUMN slug SET NOT NULL;

ALTER TABLE products
    ADD COLUMN traits_json TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_slug ON products (slug);

CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    sku VARCHAR(120) NOT NULL,
    color VARCHAR(120),
    size VARCHAR(120),
    weight VARCHAR(120),
    material VARCHAR(120),
    price NUMERIC(12, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

INSERT INTO product_variants (
    product_id,
    sku,
    price,
    stock_quantity,
    image_url,
    status,
    created_at,
    updated_at
)
SELECT
    p.id,
    CONCAT('SKU-', p.id, '-DEFAULT'),
    p.base_price,
    p.stock_quantity,
    p.main_image_url,
    CASE
        WHEN p.status = 'ARCHIVED' THEN 'ARCHIVED'
        WHEN p.status = 'DRAFT' THEN 'DRAFT'
        WHEN COALESCE(p.stock_quantity, 0) <= 0 THEN 'OUT_OF_STOCK'
        ELSE 'ACTIVE'
    END,
    p.created_at,
    p.updated_at
FROM products p;

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_variants_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS ix_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS ix_product_variants_product_status ON product_variants (product_id, status);

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    variant_id BIGINT,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_images_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_product_images_product_id ON product_images (product_id);
CREATE INDEX IF NOT EXISTS ix_product_images_variant_id ON product_images (variant_id);

INSERT INTO product_images (product_id, image_url, alt_text, sort_order, created_at, updated_at)
SELECT
    p.id,
    p.main_image_url,
    p.name,
    0,
    p.created_at,
    p.updated_at
FROM products p
WHERE p.main_image_url IS NOT NULL;

ALTER TABLE order_items
    ADD COLUMN variant_id BIGINT;

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_id BIGINT;

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_sku VARCHAR(120);

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_label VARCHAR(255) NOT NULL DEFAULT 'Default';

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_color VARCHAR(120);

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_size VARCHAR(120);

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_weight VARCHAR(120);

ALTER TABLE order_items
    ADD COLUMN variant_snapshot_material VARCHAR(120);

UPDATE order_items oi
SET
    variant_id = pv.id,
    variant_snapshot_id = pv.id,
    variant_snapshot_sku = pv.sku,
    variant_snapshot_label = 'Default',
    variant_snapshot_color = pv.color,
    variant_snapshot_size = pv.size,
    variant_snapshot_weight = pv.weight,
    variant_snapshot_material = pv.material
FROM product_variants pv
WHERE pv.product_id = oi.product_id
  AND pv.sku = CONCAT('SKU-', oi.product_id, '-DEFAULT');

ALTER TABLE order_items
    ALTER COLUMN variant_snapshot_id SET NOT NULL;

ALTER TABLE order_items
    ALTER COLUMN variant_snapshot_sku SET NOT NULL;

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_order_items_variant_id ON order_items (variant_id);

ALTER TABLE products
    DROP COLUMN stock_quantity;
