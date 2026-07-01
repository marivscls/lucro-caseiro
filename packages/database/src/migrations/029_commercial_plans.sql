-- 029: Planos comerciais — free / essential / professional
--
-- O modelo antigo era free/premium. Este passo adiciona os dois novos valores
-- ao enum plan_type e migra os assinantes do Premium antigo para o Profissional
-- (não perdem nenhum recurso — o Profissional é o plano completo).
--
-- IMPORTANTE (Postgres): `ALTER TYPE ... ADD VALUE` não pode ser usado na MESMA
-- transação em que o novo valor é referenciado. Rode este arquivo em DUAS etapas
-- no SQL editor do Supabase: primeiro os dois ADD VALUE (deixe commitar), depois
-- o UPDATE. Executando statement-a-statement (autocommit) já funciona.
--
-- O valor 'premium' permanece no enum (valores de enum não são removíveis no
-- Postgres); nenhuma linha usa mais ele após o UPDATE e o backend normaliza
-- qualquer 'premium' remanescente para 'professional'.

-- Etapa 1 — novos valores do enum
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'essential';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'professional';

-- Etapa 2 — migra assinantes Premium → Profissional (rodar após a etapa 1 commitar)
UPDATE public.users SET plan = 'professional' WHERE plan = 'premium';
