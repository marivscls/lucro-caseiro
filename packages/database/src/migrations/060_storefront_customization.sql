-- Editor administrativo da vitrine. JSONB mantém o documento versionado e permite
-- evoluir a renderização pública sem reescrever as colunas legadas do catálogo.
ALTER TABLE catalog_settings
  ADD COLUMN IF NOT EXISTS customization jsonb,
  ADD COLUMN IF NOT EXISTS published_customization jsonb,
  ADD COLUMN IF NOT EXISTS published_products jsonb,
  ADD COLUMN IF NOT EXISTS published_services jsonb;

COMMENT ON COLUMN catalog_settings.published_customization IS
  'Snapshot publicado da StorefrontCustomization; unica personalizacao nova exposta em /c/:slug.';

COMMENT ON COLUMN catalog_settings.published_products IS
  'Produtos publicos congelados no ultimo comando de publicacao.';

COMMENT ON COLUMN catalog_settings.published_services IS
  'Servicos publicos congelados no ultimo comando de publicacao.';

COMMENT ON COLUMN catalog_settings.customization IS
  'StorefrontCustomization versionado; NULL preserva catálogos legados e aplica defaults no carregamento.';
