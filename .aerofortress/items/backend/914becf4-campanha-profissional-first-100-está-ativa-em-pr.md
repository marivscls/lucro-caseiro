---
id: 914becf4-7399-4bb0-96b2-6111f204cb73
slug: backend
type: fact
title: Campanha Profissional first-100 está ativa em produção
tags: campanha, profissional, produção, resend, railway
provenance: observado
evidence: commit 73817ad; Railway deployment 2e01d600-6a2a-4344-b57b-133f8c896179 SUCCESS; packages/database/src/migrations/052_professional_trial_campaign.sql; consulta de produção em 2026-08-10; Resend IDs 49aa6158-cd7b-4caa-a24b-b8801d3516d2, 9eba3b32-3efc-4874-a246-98bcd80b1cbd, febaa757-62c8-4108-ab14-1e61586637e7, ba90eeaf-46fa-4b49-9827-fb58ddc2b051
decay: seasonal
created: 2026-08-10T19:41:35.129442500+00:00
updated: 2026-08-10T19:41:35.129442500+00:00
validated: 2026-08-10T19:41:35.129442500+00:00
links:
---

Em 2026-08-10, o commit `73817ad` foi publicado com sucesso no Railway e a migration 052 ativou a campanha `professional-first-100-2026`. Estado confirmado após o rollout: 12/100 concessões, sendo 8 da coorte inicial de 2026-08-06 e 4 automáticas (Mirian, Leandro, Paulo Gabriel e J. Pedro), todas Profissional até 2026-09-10T19:39:24.077Z; `marivscls@gmail.com` permaneceu Free como conta interna excluída. O Resend aceitou os quatro novos envios com IDs individuais e a tabela de auditoria ficou com zero e-mails pendentes. Novos cadastros elegíveis recebem a concessão atomicamente no trigger e o e-mail idempotente no primeiro carregamento de perfil, até o contador alcançar 100.
