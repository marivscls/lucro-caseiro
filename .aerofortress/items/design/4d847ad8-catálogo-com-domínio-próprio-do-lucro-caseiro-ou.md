---
id: 4d847ad8-0e26-4f12-9082-9672e83735bd
slug: design
type: decision
title: Catálogo com domínio próprio do Lucro Caseiro; outras marcas não o herdam
tags: catalogo, dominio, whitelabel, eas
provenance: observado
evidence: apps/mobile/eas.json; apps/mobile/.env; apps/mobile/src/features/catalog/api.ts; docs/whitelabel/como-gerar-build.md
decay: stable
created: 2026-06-26T12:41:17.061402100+00:00
updated: 2026-07-18T20:02:38.863635+00:00
validated: 2026-07-18T20:02:38.863635+00:00
links:
---

O domínio **lucrocaseiro.com.br** é da usuária. O link do catálogo da marca original é **https://catalogo.lucrocaseiro.com.br/c/<slug>** via `EXPO_PUBLIC_CATALOG_URL`; `publicCatalogUrl(slug)` usa `${EXPO_PUBLIC_CATALOG_URL ?? EXPO_PUBLIC_API_URL}/c/${slug}`. O DNS está ativo desde 2026-07-11 (CNAME `catalogo` para Railway; HTTP 200 verificado). A variável permanece nos três profiles EAS do Lucro Caseiro e no `apps/mobile/.env` local. Desde a arquitetura whitelabel de 2026-07-18, Papelaria e Manicure estendem profiles-base sem esse domínio: cada projeto deve fornecer seu próprio `EXPO_PUBLIC_CATALOG_URL` no ambiente EAS; sem ele, o app usa a API compartilhada como fallback. Mudança no `.env` exige reiniciar o Metro; mudança no `eas.json` exige build novo.
