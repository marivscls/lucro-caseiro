---
id: ec3fa6eb-248b-41bc-baa0-596c21da5448
slug: design
type: decision
title: Fiado usa caderno no resumo e porquinho apenas no estado vazio
tags: fiado, ilustracao, resumo, estado-vazio, responsividade, cobrancas
provenance: dito
evidence: Pedido da usuária e imagens de referência em 2026-08-16; apps/mobile/src/app/fiado.tsx; apps/mobile/src/assets/fiado-notebook-calendar.png; validação PWA em 320, 390 e 1200 px
decay: stable
created: 2026-08-14T17:18:53.572028200+00:00
updated: 2026-08-16T18:55:14.416902+00:00
validated: 2026-08-16T18:55:14.416902+00:00
links:
---

A tela Fiado canônica usa um card vinho reto de “A receber” com valores reais e a ilustração transparente do caderno/calendário em `contain`, sem texto embutido, fundo, recorte ou blur. O porquinho de `fiado-hero.png` permanece exclusivo dos estados vazio/sem resultados. A listagem usa filtros Todos/Vencidos/Próximos calculados, ordenação por antiguidade, cards brancos compactos com status textual e ações de recebimento/WhatsApp; os filtros de contato antigos continuam no ícone de filtros. A navbar compartilhada não foi alterada.
