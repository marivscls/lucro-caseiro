---
id: 6eca7053-d3c8-41ea-a4c0-fbb304958a62
slug: ui
type: scar
title: Solicitações de serviço: ações precisam parecer e responder como botões
tags: servicos, solicitacoes, botoes, affordance, status, whatsapp, mobile, optimistic-update, concorrencia
provenance: dito
evidence: Relatos e capturas da usuária em 2026-07-31; Railway HTTP logs com múltiplos PATCH 200 para /api/v1/orders/services/booking-requests/:id; apps/mobile/src/features/services/components/service-dashboard-modal.tsx; apps/mobile/src/features/services/hooks.ts; apps/mobile/src/features/services/hooks.test.ts; lint, typecheck, build PWA e 419 testes móveis aprovados
decay: stable
created: 2026-07-31T20:41:54.184949900+00:00
updated: 2026-07-31T21:34:25.749434100+00:00
validated: 2026-07-31T21:34:25.749434100+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-31): primeiro, “Chamar no WhatsApp”, “Contato feito”, “Confirmar” e “Recusar” apareciam como textos soltos; depois de ganhar bordas e cores, a usuária apontou que os estados ainda pareciam não clicáveis. DIAGNÓSTICO EM PRODUÇÃO: os cliques chegavam à API e retornavam HTTP 200, mas o cache só mudava após o refetch (~1 s); isso não dava feedback imediato e permitia vários PATCH concorrentes para a mesma solicitação. CORREÇÃO CANÔNICA: WhatsApp permanece CTA contornado com ícone; os status têm borda/cores semânticas, atualização otimista no cache, texto “Salvando status...”, bloqueio síncrono contra toques repetidos, botões desabilitados durante a mutation, rollback e alerta em caso de erro, e reconciliação final com o servidor. COMO EVITAR: affordance visual não basta para ações remotas; toda mudança rápida de status precisa responder no primeiro toque, bloquear repetição e tornar falhas visíveis.
