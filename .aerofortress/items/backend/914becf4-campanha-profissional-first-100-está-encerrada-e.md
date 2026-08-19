---
id: 914becf4-7399-4bb0-96b2-6111f204cb73
slug: backend
type: fact
title: Campanha Profissional first-100 está encerrada em produção
tags: produção, campanha, professional, trial, encerrada
provenance: observado
evidence: Railway production @lucro-caseiro/api em 2026-08-15: antes {active:true, grants_count:18, recorded_grants:18}; depois {active:false, grants_count:18, recorded_grants:18}; packages/database/src/migrations/057_end_professional_trial_campaign.sql
decay: stable
created: 2026-08-10T19:41:35.129442500+00:00
updated: 2026-08-15T15:11:49.196340+00:00
validated: 2026-08-15T15:11:49.196340+00:00
links:
---

A campanha `professional-first-100-2026`, ativada originalmente em 2026-08-10, foi encerrada em produção em 2026-08-15 por decisão da usuária. O estado confirmado passou de `active=true` para `active=false`, mantendo `grants_count=18` e 18 registros na tabela de concessões. Nenhum beneficiário existente, plano concedido ou data de expiração foi alterado. A migração 057 reaplica esse estado em toda inicialização futura da API.
