ALTER TABLE IF EXISTS order_items
    ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'ORDERED';

UPDATE order_items
SET status = 'ORDERED'
WHERE status IS NULL;

ALTER TABLE IF EXISTS order_items
    ALTER COLUMN status SET DEFAULT 'ORDERED',
    ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_order_items_status ON order_items (status);
