-- Em produção a lista fechada antiga de nomes de evento ficou com o nome automático
-- `analytics_events_check` (a 037 nunca rodou lá, e a 20260923100000 só removia
-- `analytics_events_event_name_check`). Resultado: o banco recusava todo evento novo
-- do contrato (app_crashed, purchase_result, subscription_completed, orientação...),
-- o lote inteiro do app voltava 500 e a ativação de assinatura falhava depois de
-- gravar o plano. Os nomes continuam fechados na API (zod + ANALYTICS_*_NAMES) e o
-- formato no banco (analytics_events_event_name_format_check).
--
-- Roda a cada start da API: só remove a constraint quando ela ainda é a lista de nomes.
DO $$
DECLARE
  stale_constraint text;
BEGIN
  FOR stale_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'analytics_events'::regclass
      AND contype = 'c'
      AND conname IN ('analytics_events_check', 'analytics_events_event_name_check')
      AND pg_get_constraintdef(oid) LIKE '%event_name%'
      AND pg_get_constraintdef(oid) NOT LIKE '%event_name ~%'
  LOOP
    EXECUTE format('ALTER TABLE analytics_events DROP CONSTRAINT %I', stale_constraint);
  END LOOP;
END $$;
