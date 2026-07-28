---
id: 70ceb09d-9045-4496-817a-e3a0e795e8c4
slug: ui
type: scar
title: Checkout, comparação e gerenciamento são fluxos separados
tags: checkout, lucro-caseiro, plans, settings, paywall, comparacao, gerenciamento, ui
provenance: dito
evidence: Decisão da usuária e capturas em 2026-07-25; apps/mobile/src/app/plans.tsx; apps/mobile/src/app/settings.tsx; apps/mobile/src/features/subscription/components/paywall.tsx
decay: stable
created: 2026-07-25T23:52:41.687249300+00:00
updated: 2026-07-26T01:03:23.209878400+00:00
validated: 2026-07-26T01:03:23.209878400+00:00
links:
---

CORREÇÕES CANÔNICAS DA USUÁRIA (2026-07-25): “checkout” no Lucro Caseiro inclui `/plans`, os paywalls contextuais e os pontos de assinatura em Configurações; nenhum ponto de compra pode cair nos cards antigos como se fossem o checkout. Separação final confirmada: (1) `/plans` é comparador/gerenciador, não checkout; conta Gratuita compara Essencial e Profissional e só então abre o checkout novo escolhido; (2) bloqueio contextual abre diretamente o checkout novo do tier mínimo; (3) em Configurações, conta Gratuita usa “Conhecer os planos”, conta Essencial oferece “Fazer upgrade para Profissional” (checkout novo) e “Gerenciar assinatura”, e conta Profissional oferece apenas gerenciamento. Não alterar Nova Venda nem Selenita.
