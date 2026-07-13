-- Normaliza ids gravados pelo seed completo antigo para os ids aceitos pela API.
UPDATE labels
SET template_id = CASE template_id
  WHEN 'classic' THEN 'classico'
  WHEN 'minimal' THEN 'minimalista'
  ELSE template_id
END
WHERE template_id IN ('classic', 'minimal');
