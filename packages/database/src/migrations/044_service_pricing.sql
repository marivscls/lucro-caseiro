-- Serviços como cadastro de primeira classe, com memória da formação do preço.

ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS material_cost numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS other_cost numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS fixed_cost_share numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS markup_percent numeric(7,2) NOT NULL DEFAULT 0;
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS fees_percent numeric(5,2) NOT NULL DEFAULT 0;

UPDATE services SET default_price = NULL WHERE default_price <= 0;

ALTER TABLE services
  ADD CONSTRAINT services_material_cost_non_negative CHECK (material_cost >= 0);
ALTER TABLE services
  ADD CONSTRAINT services_default_price_positive
  CHECK (default_price IS NULL OR default_price > 0);
ALTER TABLE services
  ADD CONSTRAINT services_hourly_rate_non_negative CHECK (hourly_rate >= 0);
ALTER TABLE services
  ADD CONSTRAINT services_other_cost_non_negative CHECK (other_cost >= 0);
ALTER TABLE services
  ADD CONSTRAINT services_fixed_cost_share_non_negative CHECK (fixed_cost_share >= 0);
ALTER TABLE services
  ADD CONSTRAINT services_markup_percent_range
  CHECK (markup_percent >= 0 AND markup_percent <= 1000);
ALTER TABLE services
  ADD CONSTRAINT services_fees_percent_range
  CHECK (fees_percent >= 0 AND fees_percent <= 95);
