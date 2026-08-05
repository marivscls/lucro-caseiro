---
id: 13ae3470-f675-4cf0-937c-e807fab9b19b
slug: ui
type: scar
title: Catálogo de serviços: solicitação usa sheet responsivo e centralizado
tags: catalogo, servicos, formulario, dialog, desktop, mobile, posicionamento, ui
provenance: dito
evidence: Capturas da usuária em 2026-07-31 e 2026-08-01; apps/api/src/features/catalog/catalog.domain.ts; apps/api/src/features/catalog/catalog.domain.test.ts; validação headless Chrome em 1440x900 e 500x844
decay: stable
created: 2026-07-31T17:11:34.953405900+00:00
updated: 2026-08-01T23:46:48.776264100+00:00
validated: 2026-08-01T23:46:48.776264100+00:00
links: 
---

SINTOMA (2026-07-31, mobile): o formulário de solicitação ocupava mais que a viewport móvel, deixava o CTA vulnerável ao corte e o navegador focava automaticamente o botão Fechar, exibindo um contorno azul destoante. CORREÇÃO: espelhar o StandardModal do app com cabeçalho e rodapé fixos, conteúdo central rolável, campos de 48 px/raio 16, data e horário lado a lado (empilhar apenas abaixo de 360 px), bottom sheet limitado por 100dvh/safe areas e foco programático no título ao abrir. RECORRÊNCIA/CORREÇÃO DA USUÁRIA (2026-08-01, desktop): o mesmo dialog apareceu grudado no canto esquerdo. CAUSA: o reset global `* { margin: 0 }` anulava a margem automática nativa do `<dialog>`, enquanto o CSS desktop não declarava posicionamento próprio. CORREÇÃO CANÔNICA: o dialog desktop declara `inset: 0` e `margin: auto`; o breakpoint até 720 px sobrescreve com `inset: auto 0 0` e `margin: auto 0 0` para manter o bottom sheet. COMO EVITAR: todo dialog submetido a reset global deve declarar seu posicionamento nas variantes desktop e mobile; validar visualmente ambas as viewports.
