---
id: 4c7968b8-991e-45bd-83f2-a329b3264e86
slug: design
type: decision
title: Clientes usa card de clientela com PNG conectado e lista por comportamento
tags: clientes, ui, png, responsividade, filtros, ordenacao, navbar
provenance: dito
evidence: apps/mobile/src/app/tabs/clients.tsx; apps/mobile/src/assets/clients-community.png; inspeção CDP em 2026-08-16 nos viewports 320, 360, 390 e 430 px
decay: stable
created: 2026-08-16T20:04:52.886649900+00:00
updated: 2026-08-16T21:12:09.086420200+00:00
validated: 2026-08-16T21:12:09.086420200+00:00
links:
---

A tela Clientes canônica usa o PNG transparente das três clientes conectadas pela sacolinha no lado direito do card “Sua clientela”, sem fundo, moldura, sombra, recorte ou coração. Internamente, o card usa padding responsivo de 20–24 px, título no topo com 18 px de separação e corpo horizontal em proporção aproximada de 65% para os três indicadores e 35% para a ilustração. Os números compartilham a mesma linha, as descrições ficam centralizadas abaixo, “compraram no mês” quebra somente antes de “no mês”, e os divisores são curtos e centralizados; em larguras estreitas a ilustração diminui antes do espaço dos indicadores. O layout mantém cabeçalho com FAB circular rosa, busca com filtro, chips Todos/Recentes/Frequentes/Com fiado, ordenação por menu e cards com no máximo uma etiqueta contextual; a lista reserva folga para a navbar compartilhada, que não é alterada. Indicadores, recência, frequência, fiado e valores são derivados dos dados reais já disponíveis.
