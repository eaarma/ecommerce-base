ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_status_check;

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL,
    order_id BIGINT NOT NULL,
    order_item_id BIGINT,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(255) NOT NULL DEFAULT 'EUR',
    reason VARCHAR(1000),
    quantity INTEGER,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    stripe_refund_id VARCHAR(255),
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    succeeded_at TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT fk_refunds_payment
        FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_order_item
        FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL,
    CONSTRAINT chk_refunds_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_refunds_positive_quantity CHECK (quantity IS NULL OR quantity > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_refunds_stripe_refund_id
    ON refunds (stripe_refund_id)
    WHERE stripe_refund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_refunds_payment_id ON refunds (payment_id);
CREATE INDEX IF NOT EXISTS ix_refunds_order_id ON refunds (order_id);
CREATE INDEX IF NOT EXISTS ix_refunds_order_item_id ON refunds (order_item_id);
CREATE INDEX IF NOT EXISTS ix_refunds_created_at ON refunds (created_at DESC);
