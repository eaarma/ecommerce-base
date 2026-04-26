ALTER TABLE orders
    RENAME COLUMN customer_name TO customer_first_name;

ALTER TABLE orders
    RENAME COLUMN delivery_address_line TO delivery_address_line1;

ALTER TABLE orders
    ADD COLUMN customer_last_name VARCHAR(255);

UPDATE orders
SET customer_last_name = ''
WHERE customer_last_name IS NULL;

ALTER TABLE orders
    ALTER COLUMN customer_last_name SET NOT NULL;

ALTER TABLE orders
    ADD COLUMN delivery_address_line2 VARCHAR(255);
