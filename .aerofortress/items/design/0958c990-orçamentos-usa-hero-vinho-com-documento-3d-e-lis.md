---
id: 0958c990-d313-43e2-8527-6756560bfe65
slug: design
type: decision
title: Orçamentos usa hero vinho com documento 3D e lista filtrável compacta
tags: orcamentos, mobile, pwa, design, png, busca, filtros, responsivo
provenance: observado
evidence: apps/mobile/src/app/quotes.tsx; apps/mobile/src/assets/orcamentos-documento-3d.png; lint/typecheck/test/build PWA e validação CDP executados em 2026-08-16
decay: stable
created: 2026-08-16T21:45:33.923218800+00:00
updated: 2026-08-16T21:45:33.923218800+00:00
validated: 2026-08-16T21:45:33.923218800+00:00
links:
---

A tela canônica de Orçamentos em `apps/mobile/src/app/quotes.tsx` usa cabeçalho com voltar, subtítulo e FAB rosa de 52 px; hero #4A2332 com total e contagem derivados dos orçamentos pendentes e o asset transparente `orcamentos-documento-3d.png` em `contain`; busca local por título/cliente; filtros com contadores derivados; e cards compactos com identificação, título, cliente, itens, data, valor, status e navegação. Em desktop preserva o shell e usa grade de duas colunas até 960 px; a navbar compartilhada não foi alterada. Validação PWA em 320, 390, 430 e 1280 px confirmou PNG 1254×1254, botão visível, filtros roláveis sem overflow e valores completos.
