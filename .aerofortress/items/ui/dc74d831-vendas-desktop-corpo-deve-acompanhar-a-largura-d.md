---
id: dc74d831-0da2-4979-bf1a-3db069a35cf5
slug: ui
type: scar
title: Vendas desktop: corpo deve acompanhar a largura do header dentro do shell padrão
tags: vendas, desktop, react-native-web, largura, tabela, responsividade, desktop-shell, consistencia
provenance: dito
evidence: Correção da usuária em 2026-08-16; apps/mobile/src/app/tabs/sales.tsx; build entry-b419d809181e7bc62cff6fe6897bdf51.js; validação CDP 8083 a 1716×900: header x=302..1678, primeiro KPI left=302, último KPI right=1678, bodyScrollWidth=1716; .aerofortress/sales-width-validated.png
decay: stable
created: 2026-08-16T17:24:55.308799200+00:00
updated: 2026-08-16T18:09:33.308839200+00:00
validated: 2026-08-16T18:09:33.308839200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-16): Vendas não deve ser full-bleed na viewport, mas seus containers internos precisam acompanhar a largura do header dentro do shell padrão. ESTADO INCORRETO: o `DesktopShell` corretamente fornecia 1376 px úteis (1440 menos gutters), porém o wrapper do corpo ainda aplicava `desktopStretch(..., desktopWidths.data)` e parava em 1280 px, deixando 96 px vazios à direita sob um header mais largo. CORREÇÃO CANÔNICA: manter o shell desktop padrão (`maxWidth: 1440` + gutter), manter o respiro interno de 32 px no conteúdo do header vinho, e fazer o wrapper interno de Vendas ocupar `width: "100%"` da área já disponibilizada pelo shell. KPIs, tabela, loading e erro acompanham essa largura; a busca continua deliberadamente compacta. VALIDAÇÃO: ESLint e build PWA aprovados; previews reiniciados; em runtime 8083 a 1716×900, o header ocupa x=302..1678, o primeiro KPI começa em x=302 e o último termina em x=1678, sem vazio lateral e sem overflow (`bodyScrollWidth=1716`). COMO EVITAR: medir header e corpo no mesmo runtime; devem compartilhar as mesmas bordas externas sem remover as margens globais do shell.
