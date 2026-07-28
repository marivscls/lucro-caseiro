---
id: ff8adbf2-4fc1-4a32-9b2f-c9f449dd1bfb
slug: ui
type: scar
title: Plano pago não autoriza feature Profissional
tags: planos, essential, professional, feature-gate, paywall, catalogo
provenance: dito
evidence: .aerofortress/specs/prd-gates-planos-por-feature.md; packages/contracts/src/schemas/plans.ts; correções da usuária em 2026-07-12 e 2026-07-25
decay: stable
created: 2026-07-13T02:58:50.317196300+00:00
updated: 2026-07-26T01:20:08.738487500+00:00
validated: 2026-07-26T01:20:08.738487500+00:00
links:
---

SINTOMA: após a migração para Essencial/Profissional, várias telas continuaram usando `isProfilePremiumActive`, que retorna true para qualquer plano pago. Isso liberava controles realmente exclusivos do Profissional para o Essencial e podia fechar automaticamente o paywall, embora o backend rejeitasse a ação. CORREÇÃO: autorização qualitativa usa `hasActiveFeature` com a chave específica; `isProfilePremiumActive` ficou apenas para remoção de anúncios e estado/gestão genérica da assinatura. Compras, Gastos Fixos, Insights/histórico financeiro, kits, fotos extras, rótulos, PDFs, notificações e suporte respeitam o tier mínimo. ATUALIZAÇÃO 2026-07-25: Catálogo completo/personalizado é uma exceção deliberada — `catalogPremium` e `catalogCustomization` pertencem ao Essencial, não ao Profissional. COMO EVITAR: nunca usar apenas “é pagante?”; consultar a matriz canônica e testar free/essential/professional.
