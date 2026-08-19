---
id: 66c6c2e7-9db4-4cb3-bddf-ee05f925f284
slug: ui
type: scar
title: Catálogo 852: ScrollView pode recortar a arte acima do hero
tags: catalogo-administrativo, hero, scrollview, overflow, 852x1838, png
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx:140; .aerofortress/catalog-hero-implementation-852x1838.png; antes a arte começava visualmente no hero apesar de bbox y=92, depois o topo arredondado aparece em y=92 mantendo hero y=132
decay: stable
created: 2026-08-17T03:39:12.943536+00:00
updated: 2026-08-17T03:39:12.943536+00:00
validated: 2026-08-17T03:39:12.943536+00:00
links:
---

FALHA CORRIGIDA (2026-08-17): a geometria DOM da arte do hero estava correta em 852 px (`topFromHero=-40`), mas a screenshot escondia exatamente os 40 px superiores. CAUSA: nessa faixa o cabeçalho mede 132 px e o `KeyboardAwareScrollView` também começa em y=132 com `overflow-y:auto`; um descendente do hero não pinta fora desse scrollport, independentemente de `overflow:visible` e z-index no hero. CORREÇÃO: em 601–1023 px, ampliar a área de pintura do scroll 40 px para cima com `margin-top:-40px` e compensar com `padding-top:40px`, mantendo hero e demais elementos nas mesmas coordenadas. COMO EVITAR: validação de PNG com top negativo precisa combinar DOM geometry com screenshot; offset correto não prova que um ancestral não está recortando a pintura.
