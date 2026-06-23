-- Migration: Add Cafayate municipality to Salta province in NOA region
-- Status: Active and idempotent insert or update

INSERT INTO municipalities (
    province_id,
    code,
    name,
    slug,
    description,
    latitude,
    longitude,
    is_capital,
    is_active,
    sort_order
)
VALUES (
    (SELECT id FROM provinces WHERE code = 'salta' LIMIT 1),
    'cafayate',
    'Cafayate',
    'cafayate',
    'Municipio de Cafayate, provincia de Salta',
    NULL,
    NULL,
    false,
    true,
    20
)
ON CONFLICT (code) DO UPDATE SET
    province_id = EXCLUDED.province_id,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
