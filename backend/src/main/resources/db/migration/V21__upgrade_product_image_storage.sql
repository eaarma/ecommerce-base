ALTER TABLE product_images
    RENAME COLUMN image_url TO url;

ALTER TABLE product_images
    ADD COLUMN storage_path VARCHAR(1000),
    ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT FALSE;

WITH ranked_product_images AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY product_id
            ORDER BY sort_order ASC, id ASC
        ) AS position
    FROM product_images
    WHERE variant_id IS NULL
)
UPDATE product_images pi
SET is_primary = ranked.position = 1
FROM ranked_product_images ranked
WHERE pi.id = ranked.id;

INSERT INTO product_images (
    product_id,
    variant_id,
    url,
    storage_path,
    alt_text,
    sort_order,
    is_primary,
    created_at,
    updated_at
)
SELECT
    pv.product_id,
    pv.id,
    pv.image_url,
    NULL,
    CONCAT_WS(' ', p.name, pv.color, pv.size, pv.weight, pv.material),
    0,
    TRUE,
    pv.created_at,
    pv.updated_at
FROM product_variants pv
JOIN products p
    ON p.id = pv.product_id
WHERE pv.image_url IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM product_images pi
      WHERE pi.variant_id = pv.id
        AND pi.url = pv.image_url
  );
