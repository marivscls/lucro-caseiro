---
id: 128ba01a-aab7-42ca-9566-fb70f55a6a29
slug: design
type: decision
title: Tipografia oficial do aplicativo usa Nunito Sans em todas as telas
tags: tipografia, nunito-sans, design-system, mobile, titulos, hierarquia
provenance: dito
evidence: Decisões e correções explícitas da usuária em 2026-07-25; packages/ui/src/theme.ts; packages/ui/src/components/typography.tsx
decay: stable
created: 2026-07-11T16:53:14.672318800+00:00
updated: 2026-07-25T20:35:36.755112400+00:00
validated: 2026-07-25T20:35:36.755112400+00:00
links:
---

DECISÃO MAIS RECENTE DA DONA DO PRODUTO (2026-07-25), substituindo a escolha anterior de Fraunces para display/h1/h2: o aplicativo inteiro usa Nunito Sans, inclusive títulos de telas, títulos de seções e destaques. Títulos preservam escala grande (`display` 36/42, `h1` 28/34, `h2` 22/28), mas usam Bold 700 — não ExtraBold 800, que ficou grosseiro. Textos corridos são ligeiramente menores (`body` 15/22; `caption` 13/18). ExtraBold fica para números monetários de destaque. Não usar `fontWeight` com fonte customizada nem criar exceções locais em Fraunces.
