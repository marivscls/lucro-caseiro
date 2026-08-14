---
id: efc362a3-540c-4787-a0cd-68d7a6a09413
slug: subscription
type: scar
title: Concessão manual de plano não deve apagar uma assinatura já ativa
tags: subscription, professional, manual-update, expiration, production
provenance: observado
evidence: Supabase public.users id 3e96539b-a2d1-4317-9d03-94d868366eb8; verificação em 2026-08-13
decay: stable
created: 2026-08-13T17:13:29.953130500+00:00
updated: 2026-08-13T17:13:29.953130500+00:00
validated: 2026-08-13T17:13:29.953130500+00:00
links:
---

SINTOMA (2026-08-13): ao atender um pedido para adicionar a conta ao Profissional, a conta já estava `professional` até 2027-08-10, mas a atualização inicial definiu `plan_expires_at = null`, convertendo sem autorização uma concessão anual em acesso sem vencimento. CORREÇÃO: o vencimento original `2027-08-10T23:38:11.384623+00:00` foi restaurado imediatamente e verificado na linha retornada. COMO EVITAR: antes de qualquer PATCH manual de plano, ler e interpretar o estado atual; se o plano solicitado já está ativo, preservar integralmente `plan_expires_at` e apenas reportar/diagnosticar por que o app não refletiu o estado.
