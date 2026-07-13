---
id: 227afaa9-deed-4feb-9dc3-3032cb965e99
slug: ui
type: scar
title: Produto composto: título longo e badge Kit não podem transbordar
tags: produtos, kit, layout, badge, android, overflow
provenance: observado
evidence: apps/mobile/src/app/products.tsx; apps/mobile/src/features/products/components/product-card.tsx; apps/mobile/src/features/products/display.ts; screenshots da usuária em 2026-07-13
decay: stable
created: 2026-07-13T03:09:08.625966800+00:00
updated: 2026-07-13T03:12:48.911807900+00:00
validated: 2026-07-13T03:12:48.911807900+00:00
links: 
---

SINTOMAS (2026-07-13, Android): (1) na lista, nome longo empurrava o badge “Kit” para fora da borda direita; (2) nos detalhes, nome + badge centralizados na mesma row excediam a largura e o título vazava também pela esquerda; (3) produtos de massa mostravam `[` como avatar por causa do prefixo técnico `[massa]`; (4) componente longo podia disputar espaço com o custo. CORREÇÃO: lista usa título flexível de até 2 linhas e badge não encolhível; detalhes colocam o título centralizado em largura total e o badge em linha própria; `productInitial` remove prefixo técnico entre colchetes antes de escolher a inicial; itens do kit tornam nome flexível e custo fixo. COMO EVITAR: texto variável + badge/valor fixo exige texto flexível com `minWidth: 0`; em headers centralizados estreitos, badge deve ficar fora da mesma row do título longo.
