---
id: 128ba01a-aab7-42ca-9566-fb70f55a6a29
slug: design
type: decision
title: Tipografia oficial: Fraunces (display/h1/h2) + Nunito Sans (resto) — ADR-0008
tags: tipografia, design-system, fonts
provenance: dito
evidence: docs/adr/0008-tipografia-fraunces-nunito-sans.md; packages/ui/src/components/typography.tsx
decay: stable
created: 2026-07-11T16:53:14.672318800+00:00
updated: 2026-07-11T16:53:14.672318800+00:00
validated: 2026-07-11T16:53:14.672318800+00:00
links: 
---

Escolha da dona do produto (2026-07-11) entre 3 pares propostos. Antes o app não carregava fonte nenhuma (serifa/sans do sistema + 371 fontSize inline) — causa da sensação de "2-3 fontes misturadas".

Implementação: token `fonts` em packages/ui/theme.ts (display=Fraunces*600SemiBold, displayBold=Fraunces_700Bold, regular/semiBold/bold/extraBold=NunitoSans*_), carregadas via useFonts no RootLayout (@expo-google-fonts, JS-only, sem rebuild). Escala completa no Typography (família+tamanho+lineHeight por variante; money_ com tabular-nums). Componentes base (Button/Badge/Chip/Input/EmptyState) usam o token.

REGRAS pra código novo: texto = Typography com variante certa, NUNCA fontSize/fontWeight/fontFamily inline; peso vem da FAMÍLIA (fonts.bold), nunca fontWeight — no Android fontWeight sobre fonte custom vira faux-bold ou cai pra fonte do sistema; Fraunces é só display/h1/h2. Varredura completa feita em 51 arquivos (2026-07-11). Ver docs/adr/0008-tipografia-fraunces-nunito-sans.md.
