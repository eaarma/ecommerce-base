ALTER TABLE shops
    ADD COLUMN IF NOT EXISTS contact_receiver_email VARCHAR(320),
    ADD COLUMN IF NOT EXISTS business_hours VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS show_address BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_support_email BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE shops
SET
    contact_receiver_email = COALESCE(contact_receiver_email, support_email, contact_email),
    show_address = COALESCE(show_address, TRUE),
    show_phone = COALESCE(show_phone, TRUE),
    show_support_email = COALESCE(show_support_email, TRUE);
