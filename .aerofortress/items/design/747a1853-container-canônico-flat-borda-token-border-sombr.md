---
id: 747a1853-004f-40d3-959b-5421edb072b1
slug: design
type: rule
title: Container canônico: flat + borda (token border); sombra só em overlay; CTA tracejado usa primaryBg
tags: containers, design-system, padronizacao
provenance: dito
evidence: packages/ui/src/components/card.tsx; packages/ui/src/theme.ts (tokens border/primarySoft)
decay: stable
created: 2026-07-11T17:21:01.525286700+00:00
updated: 2026-07-11T17:21:01.525286700+00:00
validated: 2026-07-11T17:21:01.525286700+00:00
links: 
---

Padronização rígida exigida pela dona (2026-07-11, "discrepâncias causam efeito de amadorismo"):

1. **Container de conteúdo** = `Card variant="elevated"` do @lucro-caseiro/ui: surfaceElevated + borderWidth 1 + `theme.colors.border` (token; light rgba(74,50,40,0.08), dark rgba(245,225,219,0.11)) + radii.xl, SEM SOMBRA. Cards NUNCA têm sombra — sombra (token `elevation`) é exclusiva de overlays flutuantes: toast, alerta, modal, FAB, botão central da tab bar.
2. **CTA tracejado** ("adicionar X"): borderStyle dashed + borderColor primaryLight + backgroundColor `theme.colors.primaryBg` (token novo: rosa suave #F9E7EA claro / #3A2B2F escuro) — nunca scrim marrom/escuro.
3. **Bordas hairline** sempre via token `theme.colors.border` — nunca rgba literal.
4. Tab bar: ícone+label centralizados como bloco; inset do Android fica FORA do padding de conteúdo (label não pode colar na barra de gestos).

Nada disso deve ser reintroduzido à mão em telas novas — usar o Card/tokens.
