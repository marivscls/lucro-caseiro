-- Encerra a oferta de 1 mes de Profissional para novos usuarios.
-- As concessoes existentes e suas datas de expiracao permanecem inalteradas.

UPDATE public.professional_trial_campaigns
SET active = false
WHERE campaign_key = 'professional-first-100-2026';
