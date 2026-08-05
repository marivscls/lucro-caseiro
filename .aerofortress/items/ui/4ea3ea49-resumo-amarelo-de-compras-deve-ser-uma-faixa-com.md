---
id: 4ea3ea49-5718-4918-9900-7fd3635281ce
slug: ui
type: scar
title: Resumo amarelo de Compras deve ser uma faixa compacta
tags: mobile, compras, summary, spacing, ui
provenance: dito
evidence: Captura da usuária em 2026-08-04; apps/mobile/src/app/purchases.tsx
decay: stable
created: 2026-08-05T01:44:08.950385700+00:00
updated: 2026-08-05T01:44:08.950385700+00:00
validated: 2026-08-05T01:44:08.950385700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): a faixa amarela `Total a pagar` ocupava altura excessiva no topo de Compras e empurrava a lista. CORREÇÃO CANÔNICA: usar margem superior média, padding vertical pequeno, raio `lg` e ícone de 20 px, preservando o valor em destaque. COMO EVITAR: cards-resumo de uma única métrica não usam padding de card editorial/hero no mobile.
