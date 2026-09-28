-- Cantinho do MEI: atividade usada no Relatório Mensal das Receitas Brutas.
-- null = a pessoa ainda não configurou (a tela pergunta na primeira vez).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mei_activity text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_mei_activity_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_mei_activity_check
      CHECK (mei_activity IS NULL OR mei_activity IN ('commerce', 'industry', 'services'));
  END IF;
END $$;
