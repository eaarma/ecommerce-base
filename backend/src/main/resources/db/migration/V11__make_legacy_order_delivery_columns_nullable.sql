ALTER TABLE orders
    ALTER COLUMN delivery_address_line1 DROP NOT NULL;

ALTER TABLE orders
    ALTER COLUMN delivery_city DROP NOT NULL;

ALTER TABLE orders
    ALTER COLUMN delivery_postal_code DROP NOT NULL;

ALTER TABLE orders
    ALTER COLUMN delivery_country DROP NOT NULL;
