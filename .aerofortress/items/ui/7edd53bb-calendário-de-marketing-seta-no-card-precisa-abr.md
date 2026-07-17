---
id: 7edd53bb-3d94-42df-84da-80746ea3d5be
slug: ui
type: scar
title: Calendário de marketing: seta no card precisa abrir o conteúdo correspondente
tags: web, central-de-marketing, calendario, navegacao, acessibilidade
provenance: observado
evidence: apps/web/src/app/(dashboard)/calendar/page.tsx; apps/web/src/app/(dashboard)/[section]/page.tsx; apps/web/src/features/marketing/resource-board.tsx; apps/web/src/app/globals.css; lint e typecheck web aprovados; /content?edit=<id> respondeu HTTP 200
decay: stable
created: 2026-07-17T00:23:29.553684600+00:00
updated: 2026-07-17T00:23:29.553684600+00:00
validated: 2026-07-17T00:23:29.553684600+00:00
links:
---

SINTOMA (2026-07-16): os cards do Calendário exibiam ChevronRight e aparência de navegação, mas clicar não direcionava. CAUSA: CalendarPage renderizava cada item como um `<article>` sem Link ou onClick. CORREÇÃO: transformar o card inteiro em Link semântico para `/content?edit=<id>` e fazer ResourceBoard abrir, após a query carregar, o editor do recurso indicado pelo parâmetro `edit`; manter foco visível e o estilo textual do card. COMO EVITAR: qualquer card com seta/hover que represente um recurso deve ter destino semântico e, quando o destino for uma listagem, carregar diretamente o recurso escolhido em vez de apenas abrir a página genérica.
