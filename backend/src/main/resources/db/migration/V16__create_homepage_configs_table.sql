CREATE TABLE IF NOT EXISTS homepage_configs (
    id BIGSERIAL PRIMARY KEY,
    hero_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    hero_title VARCHAR(255),
    hero_subtitle VARCHAR(1000),
    hero_button_text VARCHAR(120),
    hero_button_link VARCHAR(500),
    hero_button_position VARCHAR(30) NOT NULL DEFAULT 'LEFT',
    hero_image_url VARCHAR(500),
    featured_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    featured_title VARCHAR(255),
    featured_selection_mode VARCHAR(30) NOT NULL DEFAULT 'LATEST',
    featured_product_ids TEXT NOT NULL DEFAULT '[]',
    featured_max_items INTEGER NOT NULL DEFAULT 6,
    spotlight_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    spotlight_product_id BIGINT,
    spotlight_badge_title VARCHAR(120),
    collection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    collection_blocks_json TEXT NOT NULL,
    value_section_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    value_cards_json TEXT NOT NULL,
    cta_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cta_title VARCHAR(255),
    cta_description VARCHAR(1000),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_homepage_configs_singleton CHECK (id = 1)
);

INSERT INTO homepage_configs (
    id,
    hero_enabled,
    hero_title,
    hero_subtitle,
    hero_button_text,
    hero_button_link,
    hero_button_position,
    hero_image_url,
    featured_enabled,
    featured_title,
    featured_selection_mode,
    featured_product_ids,
    featured_max_items,
    spotlight_enabled,
    spotlight_badge_title,
    collection_enabled,
    collection_blocks_json,
    value_section_enabled,
    value_cards_json,
    cta_enabled,
    cta_title,
    cta_description
)
SELECT
    1,
    TRUE,
    'A warmer, easier storefront for products worth bringing home',
    'Browse a curated catalog with clear stock visibility, dependable product pages, and a calm path from discovery to checkout.',
    'Browse products',
    '/products',
    'LEFT',
    '/hero_placeholder.png',
    TRUE,
    'Featured picks',
    'LATEST',
    '[]',
    6,
    TRUE,
    'Store spotlight',
    TRUE,
    '[{"badge":"Just in","title":"Fresh arrivals","description":"Discover what is new in store","productId":null},{"badge":"Well stocked","title":"Ready to ship","description":"Browse dependable everyday picks","productId":null},{"badge":"Editor pick","title":"Signature pieces","description":"Explore standout products","productId":null},{"badge":"Low stock","title":"Limited run","description":"Take a look before stock runs low","productId":null}]',
    TRUE,
    '[{"title":"Local care","description":"A smaller-store feeling with product choices that feel personal rather than mass-picked.","iconKey":"SUPPORT"},{"title":"Reliable service","description":"Clear stock visibility, consistent product details, and a direct path from browsing to order.","iconKey":"SECURE_PAYMENT"},{"title":"Thoughtful choices","description":"A calmer catalog focused on useful products, careful sourcing, and less throwaway shopping.","iconKey":"SUSTAINABLE"}]',
    TRUE,
    'Ready to browse the catalog or ask a question before you buy?',
    'Keep exploring products, or head straight to the contact page if you want help choosing, ordering, or learning more about the store.'
WHERE NOT EXISTS (
    SELECT 1
    FROM homepage_configs
);

SELECT setval(
    pg_get_serial_sequence('homepage_configs', 'id'),
    COALESCE((SELECT MAX(id) FROM homepage_configs), 1),
    true
);
