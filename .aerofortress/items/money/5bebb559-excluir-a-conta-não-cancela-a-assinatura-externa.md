---
id: 5bebb559-f20f-452b-83d6-ba7ac01538c5
slug: money
type: scar
title: Excluir a conta não cancela a assinatura externa e o aviso precisa deixar isso explícito
tags: assinatura, exclusão-de-conta, google-play, stripe, cobrança, ux
provenance: observado
evidence: apps/mobile/src/app/settings.tsx; apps/mobile/src/shared/utils/subscription-management.ts; apps/mobile/src/features/account/delete-account-copy.ts; validação em 2026-08-10: lint e typecheck mobile aprovados, 74 arquivos/432 testes aprovados
decay: stable
created: 2026-08-10T21:47:26.451669700+00:00
updated: 2026-08-10T23:03:22.487524100+00:00
validated: 2026-08-10T23:03:22.487524100+00:00
links: 
---

SINTOMA (2026-08-10): a usuária excluiu a conta do Lucro Caseiro e depois recebeu nova cobrança mensal. CAUSA CONFIRMADA: `deleteAccount` remove apenas o usuário do Supabase Auth e os dados em `public.users`; a assinatura externa continua ativa. O diálogo antigo avisava somente sobre a perda dos dados e não informava a continuidade da cobrança. CORREÇÃO (2026-08-10): contas pagas agora recebem antes da exclusão um aviso explícito de que a cobrança continuará; no Android podem abrir diretamente o gerenciamento da assinatura no Google Play, e em iOS/Web (Stripe) abrem um pedido de cancelamento ao suporte. A exclusão só avança pela ação “Já cancelei”, e a confirmação final repete que o cancelamento foi confirmado. O gerenciamento foi centralizado e reutilizado também em Planos; o link incorreto da App Store para iOS/Web foi removido. COMO EVITAR: exclusão de dados e cancelamento financeiro são operações separadas; toda exclusão de conta paga deve explicar isso, oferecer a ação de cancelamento e obter confirmação antes de apagar os dados.
