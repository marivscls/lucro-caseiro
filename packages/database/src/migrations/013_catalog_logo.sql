-- Foto de perfil/logo do catalogo publico (personalizacao Premium).
-- Substitui a inicial do negocio no avatar do hero.
ALTER TABLE catalog_settings
  ADD COLUMN logo_url text;
