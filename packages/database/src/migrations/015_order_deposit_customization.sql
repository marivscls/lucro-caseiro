-- Encomendas: sinal (entrada) e personalizacao estruturada (tema, homenageado,
-- cores) — fluxo tipico de papelaria personalizada, bolos de festa e eventos.
ALTER TABLE orders
  ADD COLUMN deposit numeric(10, 2),
  ADD COLUMN theme text,
  ADD COLUMN honoree text,
  ADD COLUMN colors text;
