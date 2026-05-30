-- Taxas/despesas em PORCENTAGEM (iFood, cartao, comissao) aplicadas sobre o
-- PRECO DE VENDA (nao sobre o custo). Guardamos a % total, o valor em R$ e o
-- preco final (com gross-up para preservar a margem).
ALTER TABLE pricing_calculations
  ADD COLUMN fees_percent DECIMAL(5, 2) NOT NULL DEFAULT '0',
  ADD COLUMN fees_amount DECIMAL(10, 2) NOT NULL DEFAULT '0',
  ADD COLUMN final_price DECIMAL(10, 2) NOT NULL DEFAULT '0';

-- Calculos existentes nao tinham taxas: o preco final = o preco sugerido.
UPDATE pricing_calculations SET final_price = suggested_price;
