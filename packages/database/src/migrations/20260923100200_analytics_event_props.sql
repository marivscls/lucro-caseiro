-- Contexto opcional e pequeno das ações (qual limite, origem do paywall, plano).
-- A API valida chaves, tipos e tamanhos; o banco garante objeto, só em ações e tamanho.

ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS props JSONB;

ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_props_check;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_props_check CHECK (
    props IS NULL
    OR (
      event_type = 'action'
      AND jsonb_typeof(props) = 'object'
      AND octet_length(props::text) <= 1024
    )
  );
