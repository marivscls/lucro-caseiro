---
id: 9619dc52-5007-407c-99ff-3f5fda875fae
slug: backend
type: decision
title: Campanha de um mês Profissional foi encerrada para novos usuários
tags: assinatura, campanha, professional, trial, encerrada, grandfathering
provenance: dito
evidence: Pedido da usuária em 2026-08-15; packages/database/src/migrations/057_end_professional_trial_campaign.sql; verificação Railway production: active true→false, grants_count/recorded_grants 18→18
decay: stable
created: 2026-08-10T19:31:50.631343400+00:00
updated: 2026-08-15T15:11:49.081570200+00:00
validated: 2026-08-15T15:11:49.081570200+00:00
links:
---

DECISÃO DA USUÁRIA (2026-08-10): automatizar a campanha de presente de um mês do plano Profissional até completar 100 usuários beneficiados. As 8 concessões manuais de 2026-08-06 contavam no teto; cada conta elegível receberia uma única concessão, sem cobrança ou renovação automática, com e-mail idempotente e auditoria. Contas internas/teste conhecidas não consumiam vaga; `marivscls@gmail.com` ficou excluída. DECISÃO DE ESCOPO (2026-08-13): manter apenas a unicidade por conta e não adicionar bloqueio por dispositivo. NOVA DECISÃO DA USUÁRIA (2026-08-15): cancelar a oferta para todos os usuários futuros e preservar integralmente quem já havia recebido o benefício. A campanha `professional-first-100-2026` foi desativada em produção com 18 concessões registradas; registros e datas de expiração existentes não foram alterados.
