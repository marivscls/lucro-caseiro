---
id: e74132d8-483e-468a-a167-b8846bfa9454
slug: ui
type: scar
title: Conheça também só está ajustada quando o runtime exato comprova
tags: lucro-apps, lucro-caseiro, runtime, pwa, validação-visual
provenance: dito
evidence: apps/mobile/dist/lucro-caseiro; build:pwa:caseiro aprovado; http://localhost:8083/lucro-apps e /sw.js retornaram 200; bundle entry-b0304e85a8c0985d81ba59a4b89ea8c3.js contém o layout novo e não contém 'Sua Conta Lucro acompanha'
decay: stable
created: 2026-08-14T16:41:15.182765900+00:00
updated: 2026-08-14T16:55:24.791066500+00:00
validated: 2026-08-14T16:55:24.791066500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): após refatorar `apps/mobile/src/app/lucro-apps.tsx` e validar apenas o build PWA da Revenda, foi afirmado incorretamente que o Lucro Caseiro também estava ajustado por compartilhar a rota. A usuária confirmou que a tela continuava antiga. CAUSA CONFIRMADA: `apps/mobile/dist/lucro-caseiro` ainda continha o bundle anterior; somente `build:pwa:revenda` tinha sido executado. CORREÇÃO: executar `build:pwa:caseiro`, servir o preview isolado na porta canônica 8083 e confirmar no artefato que o layout antigo sumiu e o novo está presente. COMO EVITAR: não inferir entrega entre marcas a partir do fonte compartilhado; gerar, servir e inspecionar o bundle da marca exata antes de confirmar.
