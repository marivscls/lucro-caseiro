---
id: 2dc490a0-da5a-4a4d-9c3c-f183de13defa
slug: ui
type: scar
title: Sidebar compacta: restringir o eixo e ocultar o trilho sem desativar a rolagem
tags: web, sidebar, scrollbar, overflow, responsividade, viewport-baixo, next, css-cache
provenance: observado
evidence: Pedido e screenshot da usuária em 2026-07-16; apps/web/src/app/globals.css; CSS HTTP servido por localhost:3002 após reinício contém .sidebar overflow:hidden e scrollbar width/height 0; HTTP 200; git diff --check aprovado
decay: stable
created: 2026-07-16T19:24:25.204869300+00:00
updated: 2026-07-17T01:31:16.705175600+00:00
validated: 2026-07-17T01:31:16.705175600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-16): a barra horizontal continuava visível na sidebar vertical em uma tela de pouca altura. A causa original era `.sidebar nav { overflow: auto; }`, que habilitava os dois eixos. A correção canônica mantém `overflow-x: hidden`, `overflow-y: auto`, `min-height: 0` e oculta a decoração com `scrollbar-width: none` e `::-webkit-scrollbar`. NOVA RECORRÊNCIA CONFIRMADA: mesmo com parte dessas regras no disco, o Next dev servia um chunk CSS antigo; além disso, o contêiner `.sidebar` não restringia seu próprio overflow. CORREÇÃO ROBUSTA: `.sidebar { overflow: hidden; }`, nav com `width: 100%` e scrollbar WebKit com `display: none; width: 0; height: 0`; no menu inferior mobile, preservar `overflow-x: auto` e `overflow-y: hidden` para os itens continuarem acessíveis. Reiniciar o servidor Next quando o CSS HTTP não corresponder ao arquivo no disco. COMO EVITAR: validar viewport baixo e breakpoint mobile, verificar o CSS efetivamente servido e esconder só o trilho sem bloquear a rolagem necessária.
