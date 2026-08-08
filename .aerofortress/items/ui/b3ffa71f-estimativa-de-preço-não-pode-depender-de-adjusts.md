---
id: b3ffa71f-b027-4e19-bd9e-db014085778d
slug: ui
type: scar
title: Estimativa de preço não pode depender de adjustsFontSizeToFit no PWA
tags: mobile, pwa, pricing, typography, overflow, currency
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-08; apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx
decay: stable
created: 2026-08-08T21:12:31.473822400+00:00
updated: 2026-08-08T21:12:31.473822400+00:00
validated: 2026-08-08T21:12:31.473822400+00:00
links:
---

SINTOMA (2026-08-08): no card superior da Precificação, o valor `R$ 104,35` apareceu como `R$ 104,...` no PWA. CAUSA: o texto `moneyHero` tinha uma única linha limitada a 64% do card; no web, `adjustsFontSizeToFit` não evitou a elipse. CORREÇÃO CANÔNICA: reservar 72% do card para o valor e trocar para a variante `moneyLg` quando a moeda formatada ultrapassar 9 caracteres, preservando `moneyHero` para valores menores e a ilustração à direita. COMO EVITAR: valores monetários hero com ilustração lateral precisam de largura explícita suficiente e fallback tipográfico determinístico; não depender apenas de ajuste automático de fonte no PWA.
