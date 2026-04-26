ALTER TABLE orders
    DROP COLUMN IF EXISTS delivery_address_line1,
    DROP COLUMN IF EXISTS delivery_address_line2,
    DROP COLUMN IF EXISTS delivery_city,
    DROP COLUMN IF EXISTS delivery_postal_code,
    DROP COLUMN IF EXISTS delivery_country,
    DROP COLUMN IF EXISTS delivery_phone;
