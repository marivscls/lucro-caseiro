---
id: 9619dc52-5007-407c-99ff-3f5fda875fae
slug: backend
type: decision
title: Campanha automática concede um mês de Profissional aos primeiros 100 beneficiários
tags: campanha, profissional, trial, email, growth
provenance: dito
evidence: Conversa de 2026-08-10; implementação em packages/database/src/migrations/052_professional_trial_campaign.sql
decay: stable
created: 2026-08-10T19:31:50.631343400+00:00
updated: 2026-08-10T19:31:50.631343400+00:00
validated: 2026-08-10T19:31:50.631343400+00:00
links:
---

DECISÃO DA USUÁRIA (2026-08-10): automatizar a campanha de presente de um mês do plano Profissional até completar 100 usuários beneficiados. As 8 concessões manuais de 2026-08-06 contam no teto; cada conta elegível recebe uma única concessão, sem cobrança ou renovação automática, com e-mail idempotente e auditoria. Contas internas/teste conhecidas não consomem vaga; `marivscls@gmail.com` fica excluída.
