---
id: eb4c6cef-afe2-4bd9-bbe5-05d5006e35c7
slug: ui
type: scar
title: Desktop responsivo não pode ser apenas o app mobile dentro de uma shell
tags: desktop, responsividade, ui, ux, shell, correcao
provenance: dito
evidence: Correção explícita da usuária nesta conversa após a primeira implementação desktop
decay: stable
created: 2026-07-17T02:15:30.924986900+00:00
updated: 2026-07-17T02:15:30.924986900+00:00
validated: 2026-07-17T02:15:30.924986900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-16): adicionar sidebar, header, largura máxima e algumas tabelas não constitui uma adaptação desktop suficiente quando o conteúdo de cada rota continua com composição, densidade, espaçamentos e aproveitamento horizontal de celular. SINTOMA: a PWA ganhou shell desktop, mas as telas internas ainda pareciam o mobile ampliado. COMO EVITAR: revisar visualmente cada tela autenticada em viewport de computador e criar ramos responsivos próprios para composição desktop (colunas, painéis simultâneos, barras de ação, tabelas/grades, formulários, vazios e modais), mantendo o JSX/estilos mobile abaixo do breakpoint. Uma tela só passa quando a experiência interna, e não apenas o chrome de navegação, foi validada.
