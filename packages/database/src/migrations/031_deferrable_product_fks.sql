-- 031: FKs que apontam para products viram DEFERRABLE INITIALLY DEFERRED
--
-- Bug real (2026-07-08): excluir a conta (DELETE users → cascade) falhava com
-- "sale_items_product_id_products_id_fk ... is still referenced" — o cascade
-- tenta apagar products enquanto sale_items (NO ACTION, checagem imediata)
-- ainda referencia os produtos; os sale_items só morreriam depois, via
-- sales ON DELETE CASCADE. A exclusão abortava no meio e deixava a conta
-- órfã (ver migration 030).
--
-- Correção: toda FK que referencia products passa a ser adiável — a checagem
-- roda no fim da transação, quando o cascade completo já removeu tudo.
-- Comportamento normal preservado: apagar um produto avulso que tem vendas
-- continua falhando (a checagem só muda de "imediata" para "no commit").

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conrelid::regclass AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = 'public.products'::regclass
      AND NOT condeferrable
  LOOP
    EXECUTE format(
      'ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED',
      c.tbl, c.conname
    );
  END LOOP;
END $$;
