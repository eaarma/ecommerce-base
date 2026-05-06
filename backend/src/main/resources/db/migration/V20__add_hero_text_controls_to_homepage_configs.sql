ALTER TABLE homepage_configs
ADD COLUMN IF NOT EXISTS hero_text_color_mode VARCHAR(30) NOT NULL DEFAULT 'AUTO',
ADD COLUMN IF NOT EXISTS hero_custom_text_color VARCHAR(20),
ADD COLUMN IF NOT EXISTS hero_overlay_strength INTEGER NOT NULL DEFAULT 36;

UPDATE homepage_configs
SET
    hero_text_color_mode = COALESCE(NULLIF(hero_text_color_mode, ''), 'AUTO'),
    hero_custom_text_color = CASE
        WHEN hero_text_color_mode = 'CUSTOM' THEN hero_custom_text_color
        ELSE NULL
    END,
    hero_overlay_strength = CASE
        WHEN hero_overlay_strength < 0 THEN 0
        WHEN hero_overlay_strength > 100 THEN 100
        ELSE hero_overlay_strength
    END;
