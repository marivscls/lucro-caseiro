---
id: 14caebf1-a6a6-4c35-b8a8-a84f03592dbd
slug: backend
type: scar
title: Cap de campanha não pode usar LIMIT NULL quando não há vagas
tags: postgresql, campanha, limite, concorrencia, migracao
provenance: observado
evidence: packages/database/src/migrations/052_professional_trial_campaign.sql; validação transacional revertida na produção em 2026-08-10 previu 12/100 concessões
decay: stable
created: 2026-08-10T19:31:23.358510400+00:00
updated: 2026-08-10T19:31:23.358510400+00:00
validated: 2026-08-10T19:31:23.358510400+00:00
links:
---

SINTOMA (2026-08-10): na primeira versão da migração da campanha Profissional, `LIMIT (SELECT value FROM available_slots)` retornaria NULL quando a campanha estivesse inativa; no PostgreSQL, `LIMIT NULL` equivale a não aplicar limite e uma reinicialização poderia incluir usuários além do teto de 100. CORREÇÃO: usar `LIMIT COALESCE((SELECT value FROM available_slots), 0)` e manter o contador atômico no trigger. COMO EVITAR: toda seleção limitada por subconsulta opcional deve transformar ausência de linha em zero, e a validação da migração deve simular o estado sem vagas.
