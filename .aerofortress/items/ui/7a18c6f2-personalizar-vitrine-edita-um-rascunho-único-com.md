---
id: 7a18c6f2-d535-4198-a272-ae2d0ae328ed
slug: ui
type: decision
title: Personalizar vitrine edita um rascunho único com aparência separada por Produtos e Serviços
tags: catalogo, mobile, pwa, rascunho
provenance: observado
evidence: apps/mobile/src/features/catalog/catalog-customizer.ts; apps/mobile/src/features/catalog/components/catalog-customizer.tsx; apps/api/src/features/catalog/catalog.usecases.ts; packages/database/src/migrations/058_catalog_promo_visibility.sql
decay: stable
created: 2026-08-17T01:04:24.628263200+00:00
updated: 2026-08-17T01:04:24.628263200+00:00
validated: 2026-08-17T01:04:24.628263200+00:00
links:
---

A tela mobile/PWA de Personalizar vitrine mantém logo e cor compartilhados, mas conserva capa, frase, faixa e visibilidade em rascunhos separados para Produtos e Serviços. A prévia reage localmente; imagens só são enviadas e todas as configurações só são persistidas em “Salvar alterações”. A ocultação da faixa preserva seu texto e o catálogo público recebe `null` enquanto ela estiver desabilitada.
