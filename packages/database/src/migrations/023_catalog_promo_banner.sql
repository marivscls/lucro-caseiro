-- Faixa promocional opcional no topo do catalogo publico (personalizacao Premium).
ALTER TABLE catalog_settings ADD COLUMN IF NOT EXISTS promo_banner text;
