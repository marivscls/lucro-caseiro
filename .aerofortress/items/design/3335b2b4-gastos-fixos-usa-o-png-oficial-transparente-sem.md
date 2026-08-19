---
id: 3335b2b4-c1ae-443d-b782-b1cd2ba0d8c8
slug: design
type: scar
title: Gastos fixos usa o PNG oficial transparente sem transformação
tags: gastos-fixos, ui, asset, png, transparencia, responsividade, react-native-web
provenance: dito
evidence: apps/mobile/src/assets/fixed-expenses-calendar.png; apps/mobile/src/app/recurring-expenses.tsx; build PWA e validação CDP em 320, 360, 390, 412 e 430 px em 2026-08-16
decay: stable
created: 2026-07-25T19:31:21.667972300+00:00
updated: 2026-08-16T21:28:27.486318200+00:00
validated: 2026-08-16T21:28:27.486318200+00:00
links:
---

HISTÓRICO: em 2026-07-25, a usuária reverteu uma ilustração com fundo marrom e fixou como regra que o calendário 3D de Gastos fixos deve manter transparência. DECISÃO CANÔNICA ATUAL (2026-08-16): no redesign da tela, usar exatamente o PNG anexado em `apps/mobile/src/assets/fixed-expenses-calendar.png` (1254×1254 ARGB, SHA-256 `8D29DAD874B1B83923B57FB0CEB07D113808C8EF8EA6A84F51799D0C11B856F9`). Não gerar, recortar, substituir, incorporar fundo nem distorcer; a forma rosa orgânica é uma camada separada do card. No layout responsivo, reservar a zona direita e fornecer largura e altura explícitas e iguais à imagem, reduzindo-a antes dos textos em telas estreitas.
