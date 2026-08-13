---
id: 3a020e1a-b769-42b9-9242-b66a394a9bfc
slug: marketing
type: scar
title: Prompt de arte não deve rotular exemplo como ilustração
tags: marketing, prompts, carrossel, copy, ilustração, correção
provenance: dito
evidence: Correção da usuária em 2026-08-12; apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/marketing.domain.test.ts
decay: stable
created: 2026-08-12T18:06:13.323462800+00:00
updated: 2026-08-12T18:06:13.323462800+00:00
validated: 2026-08-12T18:06:13.323462800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-12): os prompts de geração de artes estavam transformando a cautela sobre exemplos hipotéticos em texto visível, incluindo instruções como “Inserir a palavra Ilustração” e apoio iniciado por “Ilustração:”. REGRA: exemplos hipotéticos devem permanecer plausíveis, mas o gerador não deve acrescentar o rótulo “Ilustração” nem aviso equivalente à copy, cena ou arte, salvo quando o próprio briefing fornecer esse texto explicitamente. COMO EVITAR: manter a regra no Visual DNA canônico e um teste de contrato que rejeite a redação antiga.
