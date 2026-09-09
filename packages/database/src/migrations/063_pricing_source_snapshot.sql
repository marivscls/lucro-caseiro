-- Nullable: historical calculations retain their original values and unknown origins.
ALTER TABLE pricing_calculations ADD COLUMN IF NOT EXISTS source_snapshot jsonb;
-- The public contract permits a markup up to 1000%, including the upper boundary.
ALTER TABLE pricing_calculations ALTER COLUMN margin_percent TYPE numeric(6, 2);
