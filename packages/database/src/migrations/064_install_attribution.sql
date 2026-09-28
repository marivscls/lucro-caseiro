-- These nullable fields already exist in production; keep fresh databases aligned.
-- Only campaign identifiers are accepted by the API. Never persist the raw referrer.
ALTER TABLE public.analytics_installations
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text;
