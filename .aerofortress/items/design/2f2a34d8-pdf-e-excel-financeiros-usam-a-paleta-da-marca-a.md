---
id: 2f2a34d8-480b-4cee-ab6b-3b58afa72b3b
slug: design
type: scar
title: PDF e Excel financeiros usam a paleta da marca ativa
tags: export, pdf, excel, branding
provenance: dito
evidence: apps/api/src/features/finance/finance.export.ts; apps/api/src/features/finance/finance.routes.ts; apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/api/src/features/finance/finance.export.test.ts
decay: stable
created: 2026-08-14T17:21:01.181842400+00:00
updated: 2026-08-14T17:21:01.181842400+00:00
validated: 2026-08-14T17:21:01.181842400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): os relatórios financeiros em PDF e Excel ainda saíam com cores do Lucro Caseiro dentro do Lucro na Revenda. Causa: o gerador da API mantinha cores e nome hardcoded, enquanto o download manual enviava apenas Authorization e omitia `x-brand`. Prevenção: todo download fora de `apiClient` deve propagar `x-brand`; a API resolve `BrandConfig` e os dois geradores derivam nome, `primary`, `primaryStrong` e variações da marca ativa. Validar o PDF pelo RGB real do content stream e o Excel pelo ARGB das células.
