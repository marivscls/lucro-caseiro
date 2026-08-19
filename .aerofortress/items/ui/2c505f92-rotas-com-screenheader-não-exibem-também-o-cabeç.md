---
id: 2c505f92-d545-4a01-b3f9-203b9c213954
slug: ui
type: scar
title: Rotas com ScreenHeader não exibem também o cabeçalho nativo
tags: screen-header, stack, lucro-apps, operations, mobile, pwa
provenance: dito
evidence: Capturas da usuária em 2026-08-14; apps/mobile/src/app/_layout.tsx; bundles PWA Lucro Caseiro e Lucro na Revenda contêm `headerShown:!1` nas rotas `lucro-apps` e `operations`; `/lucro-apps` na 8083 e `/operations` na 8086 responderam 200; typecheck, lint e builds exatos aprovados
decay: stable
created: 2026-08-14T17:09:03.063076900+00:00
updated: 2026-08-14T17:10:53.282005300+00:00
validated: 2026-08-14T17:10:53.282005300+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-14): primeiro `/lucro-apps` mostrou o cabeçalho nativo da Stack com seta e título “Conheça também” acima do `ScreenHeader` próprio; logo depois `/operations` repetiu o mesmo erro com “Operação da Revenda”. CORREÇÃO: as duas `Stack.Screen` declaram `headerShown: false` em todos os layouts; cada tela mantém seu `ScreenHeader` interno responsável por título e retorno no mobile, ocultando o voltar no desktop. COMO EVITAR: toda rota que já renderiza `ScreenHeader` deve ocultar o header nativo no nível da Stack; não condicionar essa ocultação apenas ao shell desktop.
