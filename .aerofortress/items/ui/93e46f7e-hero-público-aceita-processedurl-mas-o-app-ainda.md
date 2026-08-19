---
id: 93e46f7e-1b06-45e7-ae75-26d5f481407a
slug: ui
type: fact
title: Hero público aceita processedUrl, mas o app ainda não remove fundos
tags:
provenance: observado
evidence: packages/contracts/src/schemas/catalog.ts; apps/mobile/src/features/catalog/components/catalog-customizer.tsx; apps/api/src/features/catalog/storefront-renderer.ts
decay: seasonal
created: 2026-08-19T01:14:36.746632600+00:00
updated: 2026-08-19T01:14:36.746632600+00:00
validated: 2026-08-19T01:14:36.746632600+00:00
links:
---

O contrato de destaques do hero agora aceita `processedUrl`, e o renderer público prioriza essa URL com tratamento transparente (`object-fit: contain`, fundo transparente e drop-shadow). `assetUrl` permanece como fallback com máscara orgânica editorial. Limitação confirmada em 2026-08-18: o controle “Remover fundo automaticamente” do personalizador continua desativado porque não existe processador de remoção de fundo no app/backend; o painel apenas preserva e reenvia `processedUrl` quando ele já existe.
