-- Personalizacao do catalogo publico (exclusivo Premium, gate no backend):
-- capa, cor do tema (preset) e frase de apresentacao.
ALTER TABLE catalog_settings
  ADD COLUMN cover_url text,
  ADD COLUMN accent_color text,
  ADD COLUMN tagline text;
