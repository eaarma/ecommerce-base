ALTER TABLE products
    ADD COLUMN category VARCHAR(40);

ALTER TABLE products
    ADD CONSTRAINT chk_products_category
    CHECK (
        category IS NULL
        OR category IN ('APPAREL', 'HOME', 'BEAUTY', 'ELECTRONICS', 'ACCESSORIES', 'GIFTS')
    );
