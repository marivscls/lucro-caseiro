---
id: fe836270-3eff-4b4a-8e9a-da477f994a63
slug: ui
type: scar
title: Footer da vitrine deve usar a logo atual do app, não um ícone antigo
tags: branding, catalogo, logo
provenance: dito
evidence: apps/api/src/features/catalog/catalog-logo.ts
decay: stable
created: 2026-07-11T18:51:56.670736400+00:00
updated: 2026-07-11T18:51:56.670736400+00:00
validated: 2026-07-11T18:51:56.670736400+00:00
links:
---

SINTOMA (2026-07-11): o footer da vitrine pública mostrava um ícone escuro antigo, diferente da logo atual do aplicativo. CORREÇÃO: gerar o PNG 56x56 embutido no backend a partir do asset canônico `apps/mobile/assets/icon.png`. COMO EVITAR: ao alterar branding do app, conferir também `catalog-logo.ts`; não tratar uma cópia base64 antiga como fonte oficial.
