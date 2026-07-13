-- Faz o QR dos rotulos existentes abrir diretamente o produto no catalogo do dono.
UPDATE labels AS label
SET qr_code_url =
  'https://catalogo.lucrocaseiro.com.br/c/' || settings.slug ||
  '?produto=' || label.product_id::text ||
  '#produto-' || label.product_id::text
FROM catalog_settings AS settings
WHERE settings.user_id = label.user_id
  AND label.product_id IS NOT NULL;
