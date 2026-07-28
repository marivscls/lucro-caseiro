-- Abrir o WhatsApp não comprova o envio; todos os orçamentos não concluídos
-- permanecem como "pending" (Aguardando) até aprovação ou recusa.
UPDATE quotes
SET status = 'pending', updated_at = now()
WHERE status IN ('draft', 'sent');

ALTER TABLE quotes
ALTER COLUMN status SET DEFAULT 'pending';
