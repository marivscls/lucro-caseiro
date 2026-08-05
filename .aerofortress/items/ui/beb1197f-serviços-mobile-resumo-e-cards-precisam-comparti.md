---
id: beb1197f-3cd2-4a0f-b3a2-f571084277cb
slug: ui
type: scar
title: Serviços mobile: resumo e cards precisam compartilhar a mesma rolagem
tags: servicos, mobile, flatlist, rolagem, layout, cta
provenance: dito
evidence: Relato e captura da usuária em 2026-07-31; apps/mobile/src/app/services.tsx; typecheck, ESLint do arquivo, build PWA, 418 testes e validação Playwright em viewport 390x844 aprovados
decay: stable
created: 2026-07-31T17:21:25.306072300+00:00
updated: 2026-07-31T17:21:25.306072300+00:00
validated: 2026-07-31T17:21:25.306072300+00:00
links: 
---

SINTOMA (2026-07-31): na tela Serviços do celular, o resumo, a busca e os filtros ficavam fora da `FlatList`; eles consumiam quase toda a altura e deixavam apenas uma faixa pequena rolável para o card, que parecia escondido atrás do rodapé. CORREÇÃO: colocar visão geral, busca e filtros no `ListHeaderComponent` da mesma `FlatList` dos serviços, mantendo um único dono da rolagem vertical e o CTA de cadastro fora da lista. COMO EVITAR: em telas móveis com cabeçalho de lista alto, controles pré-lista e itens devem compartilhar o mesmo contêiner rolável; não reservar apenas a altura restante para os cards.
