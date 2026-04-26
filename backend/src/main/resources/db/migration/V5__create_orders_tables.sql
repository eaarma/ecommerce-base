CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    reservation_token UUID,
    expires_at TIMESTAMP(6) WITH TIME ZONE,
    status VARCHAR(255) NOT NULL DEFAULT 'RESERVED',
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    delivery_address_line VARCHAR(255) NOT NULL,
    delivery_city VARCHAR(255) NOT NULL,
    delivery_postal_code VARCHAR(255) NOT NULL,
    delivery_country VARCHAR(255) NOT NULL,
    delivery_phone VARCHAR(255),
    subtotal NUMERIC(12, 2) NOT NULL,
    shipping_total NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(255) NOT NULL DEFAULT 'EUR',
    finalized_at TIMESTAMP(6) WITH TIME ZONE,
    paid_at TIMESTAMP(6) WITH TIME ZONE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    product_snapshot_id BIGINT NOT NULL,
    product_snapshot_name VARCHAR(255) NOT NULL,
    product_snapshot_image_url VARCHAR(255),
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_reservation_token ON orders (reservation_token);
CREATE INDEX IF NOT EXISTS ix_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS ix_orders_customer_email ON orders (customer_email);
CREATE INDEX IF NOT EXISTS ix_orders_expires_at ON orders (expires_at);
CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_product_id ON order_items (product_id);
