-- Pattern decorativo sobre a cor do hero do catalogo (personalizacao Premium):
-- dots (pontinhos), bubbles (bolinhas), grid (jogo da velha), stripes (listras).
ALTER TABLE catalog_settings
  ADD COLUMN pattern text;
