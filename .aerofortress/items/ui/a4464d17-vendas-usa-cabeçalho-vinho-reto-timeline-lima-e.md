---
id: a4464d17-6fee-418b-ab19-c53e3aa30ded
slug: ui
type: fact
title: Vendas usa cabeçalho vinho reto, timeline lima e navbar flutuante com ação central
tags: vendas, navbar, timeline, responsividade, lucro-caseiro
provenance: observado
evidence: apps/mobile/src/app/tabs/sales.tsx; apps/mobile/src/features/sales/components/sale-card.tsx; apps/mobile/src/app/tabs/_layout.tsx; apps/mobile/src/shared/layout/floating-tab-bar.ts
decay: seasonal
created: 2026-08-16T17:14:41.191632400+00:00
updated: 2026-08-16T17:14:41.191632400+00:00
validated: 2026-08-16T17:14:41.191632400+00:00
links:
---

A tela canônica de Vendas foi redesenhada com cabeçalho vinho reto, avatar, resumo de recebidos/quantidade, abas roláveis, busca com filtro separado, grupos por data em timeline lima e cards com filete rosa, imagem, cliente, pagamento, preço, status e seta. A navbar compartilhada preserva rotas/estado ativo e usa ação central circular `Nova venda`; o conteúdo de Vendas calcula padding inferior com o inset real. Validado no PWA autenticado em 320, 390 e 768 px, incluindo dados simulados apenas na camada de validação; typecheck, lint, 453 testes e build PWA Lucro Caseiro passaram. Não houve aparelho Android conectado nesta sessão.
