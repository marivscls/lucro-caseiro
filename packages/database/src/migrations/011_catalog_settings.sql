-- Catalogo publico: pagina web compartilhavel com os produtos do usuario e
-- botao de pedido via WhatsApp. 1 linha por usuario; slug unico e a URL publica.
CREATE TABLE catalog_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  -- WhatsApp para receber pedidos; se null, usa users.phone.
  whatsapp text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_catalog_settings_slug ON catalog_settings(slug);
