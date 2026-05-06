CREATE TABLE IF NOT EXISTS shops (
    id BIGSERIAL PRIMARY KEY,
    store_name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    short_description VARCHAR(500),
    long_description TEXT,
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    contact_email VARCHAR(320),
    support_email VARCHAR(320),
    phone_number VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(150),
    postal_code VARCHAR(40),
    country VARCHAR(120),
    instagram_url VARCHAR(500),
    facebook_url VARCHAR(500),
    tiktok_url VARCHAR(500),
    x_url VARCHAR(500),
    primary_color VARCHAR(20) NOT NULL DEFAULT '#0284c7',
    accent_color VARCHAR(20) NOT NULL DEFAULT '#f59e0b',
    theme_mode VARCHAR(30) NOT NULL DEFAULT 'LIGHT',
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    seo_keywords VARCHAR(1000),
    og_image_url VARCHAR(500),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_shops_singleton CHECK (id = 1)
);

INSERT INTO shops (
    id,
    store_name,
    primary_color,
    accent_color,
    theme_mode,
    seo_title,
    seo_description
)
SELECT
    1,
    'Ecommerce Store',
    '#0284c7',
    '#f59e0b',
    'LIGHT',
    'Ecommerce Store',
    'We sell goods.'
WHERE NOT EXISTS (
    SELECT 1
    FROM shops
);

SELECT setval(
    pg_get_serial_sequence('shops', 'id'),
    COALESCE((SELECT MAX(id) FROM shops), 1),
    true
);
