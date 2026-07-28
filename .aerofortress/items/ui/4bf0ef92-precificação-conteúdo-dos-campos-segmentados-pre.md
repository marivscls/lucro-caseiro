---
id: 4bf0ef92-4795-41b3-8cbf-cf14696ef12b
slug: ui
type: scar
title: Precificação: conteúdo dos campos segmentados precisa de recuo após o ícone
tags: precificacao, campos, espacamento, mobile, referencia-visual
provenance: dito
evidence: Correção visual da usuária em 2026-07-25; apps/mobile/src/shared/components/form-field.tsx; .codex-logs/pricing-fields-right-padding.png
decay: stable
created: 2026-07-25T20:56:57.081294900+00:00
updated: 2026-07-25T20:56:57.081294900+00:00
validated: 2026-07-25T20:56:57.081294900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): nos campos segmentados da Precificação, `R$`, valores e placeholders começavam imediatamente após a faixa rosa do ícone e pareciam deslocados para a esquerda. CORREÇÃO CANÔNICA: quando `TextFieldCard` usa `iconSurface`, o contêiner de conteúdo recebe `paddingLeft: spacing.md` além do espaçamento entre prefixo e entrada; a faixa do ícone permanece fixa. COMO EVITAR: superfícies segmentadas não devem usar a borda da faixa como início direto do texto; validar o recuo em materiais, embalagem, lucro e taxa.
