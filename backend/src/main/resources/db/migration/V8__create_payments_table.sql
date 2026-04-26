CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    order_id BIGINT NOT NULL,
    provider VARCHAR(255) NOT NULL DEFAULT 'STRIPE',
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    provider_payment_intent_id VARCHAR(255),
    provider_charge_id VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(255) NOT NULL DEFAULT 'EUR',
    failure_code VARCHAR(255),
    failure_message VARCHAR(2000),
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_provider_payment_intent_id
    ON payments (provider_payment_intent_id)
    WHERE provider_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_payments_order_id ON payments (order_id);
CREATE INDEX IF NOT EXISTS ix_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS ix_payments_created_at ON payments (created_at DESC);
