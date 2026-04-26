CREATE TABLE deliveries
(
    id                    BIGSERIAL PRIMARY KEY,
    order_id              BIGINT       NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    method                VARCHAR(50)  NOT NULL,
    status                VARCHAR(50)  NOT NULL,
    recipient_name        VARCHAR(255) NOT NULL,
    recipient_phone       VARCHAR(255),
    recipient_email       VARCHAR(255) NOT NULL,
    carrier               VARCHAR(50)  NOT NULL,
    parcel_locker_id      VARCHAR(255),
    parcel_locker_name    VARCHAR(255),
    parcel_locker_address VARCHAR(500),
    address_line1         VARCHAR(255),
    address_line2         VARCHAR(255),
    city                  VARCHAR(255),
    postal_code           VARCHAR(100),
    country               VARCHAR(255),
    tracking_number       VARCHAR(255),
    tracking_url          VARCHAR(1000),
    shipped_at            TIMESTAMPTZ,
    delivered_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO deliveries (
    order_id,
    method,
    status,
    recipient_name,
    recipient_phone,
    recipient_email,
    carrier,
    address_line1,
    address_line2,
    city,
    postal_code,
    country,
    created_at,
    updated_at
)
SELECT o.id,
       'POSTAL_DELIVERY',
       CASE
           WHEN o.status = 'PAID' THEN 'READY_TO_SHIP'
           WHEN o.status IN ('CANCELLED', 'EXPIRED') THEN 'CANCELLED'
           ELSE 'NOT_READY'
           END,
       TRIM(CONCAT(COALESCE(o.customer_first_name, ''), ' ', COALESCE(o.customer_last_name, ''))),
       NULLIF(TRIM(o.delivery_phone), ''),
       o.customer_email,
       'OTHER',
       o.delivery_address_line1,
       o.delivery_address_line2,
       o.delivery_city,
       o.delivery_postal_code,
       o.delivery_country,
       o.created_at,
       o.updated_at
FROM orders o
WHERE NOT EXISTS (
    SELECT 1
    FROM deliveries d
    WHERE d.order_id = o.id
);
