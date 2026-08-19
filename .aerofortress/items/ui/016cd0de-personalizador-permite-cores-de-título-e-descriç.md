---
id: 016cd0de-135d-4035-91f2-2cb90e02c84f
slug: ui
type: decision
title: Personalizador permite cores de título e descrição por seção da vitrine
tags: catalogo, personalizador, cores, titulo, descricao, produtos, servicos
provenance: observado
evidence: packages/database/src/migrations/059_catalog_text_colors.sql; packages/contracts/src/schemas/catalog.ts; apps/mobile/src/features/catalog/components/catalog-customizer.tsx; apps/api/src/features/catalog/catalog.domain.ts
decay: stable
created: 2026-08-18T20:42:27.553720800+00:00
updated: 2026-08-18T20:42:27.553720800+00:00
validated: 2026-08-18T20:42:27.553720800+00:00
links:
---

O personalizador do Catálogo permite escolher separadamente as cores do título e da descrição para Produtos e Serviços, pois cada seção pode usar uma capa com contraste diferente. As escolhas são persistidas em catalog_settings, aparecem imediatamente na prévia e são aplicadas ao hero do renderer público; valores nulos restauram as cores padrão. A personalização continua sob o gate catalogCustomization.
