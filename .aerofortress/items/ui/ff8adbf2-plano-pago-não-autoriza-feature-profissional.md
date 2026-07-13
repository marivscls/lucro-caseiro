---
id: ff8adbf2-4fc1-4a32-9b2f-c9f449dd1bfb
slug: ui
type: scar
title: Plano pago não autoriza feature Profissional
tags: planos, essential, professional, feature-gate, paywall
provenance: dito
evidence: .aerofortress/specs/prd-gates-planos-por-feature.md; correção da usuária em 2026-07-12 ao notar Gastos Fixos disponível no Essencial
decay: stable
created: 2026-07-13T02:58:50.317196300+00:00
updated: 2026-07-13T02:58:50.317196300+00:00
validated: 2026-07-13T02:58:50.317196300+00:00
links:
---

SINTOMA: após a migração para Essencial/Profissional, várias telas continuaram usando `isProfilePremiumActive`, que retorna true para qualquer plano pago. Isso liberava controles exclusivos do Profissional para o Essencial e podia fechar automaticamente o paywall, embora o backend rejeitasse a ação. CORREÇÃO: autorização qualitativa usa `hasActiveFeature` com a chave específica; `isProfilePremiumActive` ficou apenas para remoção de anúncios e estado/gestão genérica da assinatura. Foram corrigidos Compras, Gastos Fixos, Insights/histórico financeiro, kits, fotos extras, rótulos, PDFs de orçamento/recibo, catálogo, notificações/aniversários e suporte prioritário. O paywall agora respeita o tier mínimo. COMO EVITAR: nunca usar “é pagante?” como autorização de recurso; toda feature comercial precisa de chave na matriz e teste free/essential/professional.
