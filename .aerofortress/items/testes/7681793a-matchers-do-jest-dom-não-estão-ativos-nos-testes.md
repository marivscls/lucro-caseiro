---
id: 7681793a-38fc-48df-9f84-1265556bba87
slug: testes
type: scar
title: Matchers do jest-dom não estão ativos nos testes mobile
tags: vitest, mobile, testing-library
provenance: observado
evidence: apps/mobile/src/features/suppliers/components/supplier-form.test.tsx
decay: stable
created: 2026-08-19T01:17:48.533100300+00:00
updated: 2026-08-19T01:17:48.533100300+00:00
validated: 2026-08-19T01:17:48.533100300+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): um teste novo de SupplierForm usou `toHaveAttribute`, mas o Vitest mobile não carrega os matchers do jest-dom e falhou com `Invalid Chai property`. CORREÇÃO: ler o atributo pelo DOM (`element.getAttribute(...)`) e comparar com os matchers nativos do Vitest. COMO EVITAR: nos testes de `apps/mobile`, usar apenas matchers Chai/Vitest já configurados, salvo se o setup passar a instalar explicitamente jest-dom.
