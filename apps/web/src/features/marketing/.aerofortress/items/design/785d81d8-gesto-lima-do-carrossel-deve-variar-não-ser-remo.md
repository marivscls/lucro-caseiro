---
id: 785d81d8-a13b-4e69-b7a8-f5b77f2cf7b0
slug: design
type: scar
title: Gesto lima do carrossel deve variar, não ser removido nem virar um V repetido
tags: carrossel, visual-dna, lima, gesto-grafico, variacao, prompt, migracao, validacao
provenance: dito
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/campaign-ai.ts; 40 testes de marketing, typecheck e lint focado aprovados em 2026-08-12
decay: stable
created: 2026-08-12T03:15:23.996219700+00:00
updated: 2026-08-12T03:26:53.579461+00:00
validated: 2026-08-12T03:26:53.579461+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-12): as artes foram aprovadas, porém o gerador repetiu em todos os slides a mesma linha lima em forma de “V”. A linha/gesto verde faz parte da linguagem visual e não deve ser simplesmente proibida; deve ser dinâmica. REGRA CANÔNICA: preservar um gesto lima por slide, com função narrativa, mas variar entre slides sua forma, posição, escala, direção e relação com a composição. Nunca repetir a mesma silhueta, especialmente o mesmo “V”, em slides consecutivos ou ao longo de todo o carrossel. IMPLEMENTADO: cada slidePrompt declara `GESTO LIMA: forma=...; posição=...; função=...`; a validação rejeita forma repetida e campanhas antigas recebem presets distintos ao serem carregadas, preservando a copy.
