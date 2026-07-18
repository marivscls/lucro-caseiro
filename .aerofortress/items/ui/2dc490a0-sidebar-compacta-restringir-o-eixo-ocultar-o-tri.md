---
id: 2dc490a0-da5a-4a4d-9c3c-f183de13defa
slug: ui
type: scar
title: Sidebar compacta: restringir o eixo, ocultar o trilho e confirmar produção
tags: web, sidebar, scrollbar, overflow, responsividade, viewport-baixo, next, css-cache, producao, deploy
provenance: observado
evidence: apps/web/src/app/globals.css; commit de7951f; push origin/main em 2026-07-17; Railway @lucro-caseiro/web Online; https://lucro-caseiroweb-production.up.railway.app/_next/static/chunks/05xpb4y5fszk4.css verificado em produção
decay: stable
created: 2026-07-16T19:24:25.204869300+00:00
updated: 2026-07-17T13:02:18.549997300+00:00
validated: 2026-07-17T13:02:18.549997300+00:00
links: 
---

SINTOMA (2026-07-16): a barra horizontal continuava visível na sidebar vertical em uma tela de pouca altura. A causa original era `.sidebar nav { overflow: auto; }`, que habilitava os dois eixos. A correção canônica mantém `.sidebar { overflow: hidden; }`; no `nav`, `width: 100%`, `min-height: 0`, `overflow-x: hidden`, `overflow-y: auto`, `scrollbar-width: none`; e no `::-webkit-scrollbar`, `display: none`, `width: 0`, `height: 0`. No menu inferior mobile, preservar `overflow-x: auto` e `overflow-y: hidden` para os itens continuarem acessíveis. RECORRÊNCIAS: o Next dev já serviu chunk CSS antigo até reiniciar; em 2026-07-17 a usuária confirmou que a remoção ainda não estava em produção porque o commit local `de7951f` não havia sido enviado ao remoto. A correção só foi considerada entregue depois de `git push origin main`, Railway Online e inspeção do CSS público mostrando `.sidebar{...overflow:hidden}`, `.sidebar nav{...overflow:hidden auto}` e o trilho WebKit com largura/altura zero. COMO EVITAR: para ajustes visuais de produção, validar viewport baixo e breakpoint mobile, conferir o CSS efetivamente servido e confirmar o deploy remoto; teste local ou commit não publicado não conta como entrega.
