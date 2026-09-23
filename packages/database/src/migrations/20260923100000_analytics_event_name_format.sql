-- A lista fechada de 037 ficou para trás do contrato (cadastros de apoio, orientação,
-- validações e a tela de serviços) e o banco rejeitava esses eventos em silêncio.
-- Os nomes continuam fechados na API (zod + ANALYTICS_*_NAMES); aqui fica só o formato.

ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_name_check;

ALTER TABLE analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_name_format_check;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_event_name_format_check CHECK (
    event_name ~ '^[a-z][a-z0-9_]{0,79}$'
  );
