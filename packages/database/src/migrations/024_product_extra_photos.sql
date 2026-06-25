-- Fotos adicionais do produto (galeria), além da principal `photo_url`.
-- Máx 2 (total 3 por produto); exclusivo do Premium (gate na API).
ALTER TABLE products ADD COLUMN IF NOT EXISTS extra_photos text[] NOT NULL DEFAULT '{}';
