---
id: 03ec7b78-f413-4dba-bd97-407b5b4cfd49
slug: ui
type: scar
title: Catálogo: geometria do hero não pode depender de classes adicionadas por efeito
tags: catalogo-administrativo, hero, react-native-web, useeffect, css, layout
provenance: dito
evidence: apps/mobile/src/app/catalog.tsx; screenshot da usuária 2026-08-18; pnpm build:pwa:caseiro aprovado com bundle entry-9baa47653920e39775b94eddae54fe72.js
decay: stable
created: 2026-08-18T19:33:06.524344300+00:00
updated: 2026-08-18T19:33:06.524344300+00:00
validated: 2026-08-18T19:33:06.524344300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-18): na tela administrativa de Catálogo em viewport estreita, o fundo vinho ficou como um retângulo isolado no topo enquanto texto, selo e PNG apareceram abaixo. CAUSA: posição absoluta, z-index e tamanho da arte no PWA dependiam de classes adicionadas por efeitos com querySelector e de um style global removido no cleanup; com instâncias transitórias da rota, a tela visível podia perder o CSS e os filhos voltavam ao fluxo normal. CORREÇÃO: aplicar diretamente no CatalogHero os estilos estruturais de wrapper, fundo, copy, âncora e img; manter o style web idempotente e permanente apenas para overflow da página/scrollport responsivo. COMO EVITAR: layout essencial de um componente não deve depender de efeito DOM global nem de testID/querySelector; use props de style no próprio elemento.
