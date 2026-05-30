-- Venda por peso (R$/kg). Um produto pode ser vendido por unidade OU por quilo.
-- 1) products.sale_unit: "unit" (default) ou "kg". Quando "kg", sale_price = preco por quilo.
-- 2) sale_items.quantity passa de integer para numeric(10,3) para aceitar peso (ex.: 1.5 kg).
ALTER TABLE products
  ADD COLUMN sale_unit TEXT NOT NULL DEFAULT 'unit';

ALTER TABLE sale_items
  ALTER COLUMN quantity TYPE numeric(10, 3) USING quantity::numeric;
